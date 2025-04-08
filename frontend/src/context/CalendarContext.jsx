import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { db, auth } from '../firebaseConfig'; // Import db and auth
import {
  collection,
  query,
  // where, // Keep if needed for specific queries, otherwise remove
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { useToast } from '@chakra-ui/react';

const CalendarContext = createContext();

export const useCalendar = () => useContext(CalendarContext);

export const CalendarProvider = ({ children }) => {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  // State for data and UI
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null); // Add state for selected employee
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [view, setView] = useState('month');
  const [loadingData, setLoadingData] = useState(true);

  // --- Authentication Listener ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      console.log("Auth state changed, user:", user ? user.uid : 'none');
      setCurrentUser(user);
      if (!user) {
        setEvents([]);
        setEmployees([]);
        setLoadingData(false);
        console.log("User logged out, clearing data.");
      } else {
        setLoadingData(true); // Start loading when user logs in or is detected
        console.log("User detected, setting loading state.");
      }
    });
    return () => {
      console.log("Cleaning up auth listener.");
      unsubscribeAuth();
    };
  }, []);

  // --- Firestore Data Listeners ---
  useEffect(() => {
    if (!currentUser) {
      console.log("Firestore listeners: No current user, skipping fetch.");
      if (!loadingData) setLoadingData(false); // Ensure loading is false if no user
      return; // Stop if no user
    }

    // Only set loading true if we actually have a user
    if (!loadingData) setLoadingData(true);
    const userId = currentUser.uid;
    console.log(`Firestore listeners: Setting up for user ${userId}`);

    let unsubEvents = () => {};
    let unsubEmployees = () => {};

    try {
      // --- Events Listener ---
      const eventsCollectionRef = collection(db, 'users', userId, 'events');
      const eventsQuery = query(eventsCollectionRef);
      console.log(`Firestore listeners: Querying path: users/${userId}/events`);

      unsubEvents = onSnapshot(eventsQuery, (querySnapshot) => {
        console.log(`Firestore listeners: Received ${querySnapshot.docs.length} events snapshot.`);
        const fetchedEvents = querySnapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            ...data,
            start: data.start?.toDate ? data.start.toDate() : new Date(data.start || Date.now()), // Fallback for invalid date
            end: data.end?.toDate ? data.end.toDate() : new Date(data.end || Date.now()),       // Fallback for invalid date
          };
        });
        setEvents(fetchedEvents);
        setLoadingData(false); // Consider separate loading states if needed
        console.log("Firestore listeners: Events updated, loading set to false.");
      }, (error) => {
        console.error(`Firestore listeners: Error fetching events for user ${userId}:`, error);
        toast({ title: "Error loading events", description: error.message, status: "error", duration: 9000, isClosable: true });
        setLoadingData(false);
      });

      // --- Employees Listener ---
      const employeesCollectionRef = collection(db, 'users', userId, 'employees');
      const employeesQuery = query(employeesCollectionRef);
      console.log(`Firestore listeners: Querying path: users/${userId}/employees`);

      unsubEmployees = onSnapshot(employeesQuery, (querySnapshot) => {
        console.log(`Firestore listeners: Received ${querySnapshot.docs.length} employees snapshot.`);
        const fetchedEmployees = querySnapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
          };
        });
        setEmployees(fetchedEmployees);
        // Potentially set loading false here only if events are also loaded
      }, (error) => {
        console.error(`Firestore listeners: Error fetching employees for user ${userId}:`, error);
        toast({ title: "Error loading employees", description: error.message, status: "error", duration: 9000, isClosable: true });
        // Handle overall loading state
      });

    } catch (error) {
        console.error(`Firestore listeners: Error setting up listeners for user ${userId}:`, error);
        toast({ title: "Error setting up data listeners", description: error.message, status: "error", duration: 9000, isClosable: true });
        setLoadingData(false); // Ensure loading stops on setup error
    }


    // Cleanup function
    return () => {
      console.log(`Firestore listeners: Cleaning up for user ${userId}`);
      unsubEvents();
      unsubEmployees();
    };
  }, [currentUser, toast]); // Dependency: re-run if currentUser or toast changes


  // --- Firestore CRUD Operations ---

  const addEvent = useCallback(async (eventData) => {
    if (!currentUser) {
      toast({ title: "Not Logged In", description: "You must be logged in to add events.", status: "warning", duration: 5000, isClosable: true });
      return;
    }
    const userId = currentUser.uid;
    console.log(`Firestore CRUD: Attempting to add event for user ${userId}`);
    try {
      const eventsCollectionRef = collection(db, 'users', userId, 'events');
      const processedEventData = {
        ...eventData,
        userId: userId, // Ensure userId is stored
        start: eventData.start instanceof Date ? Timestamp.fromDate(eventData.start) : Timestamp.now(), // Convert or use current time
        end: eventData.end instanceof Date ? Timestamp.fromDate(eventData.end) : Timestamp.now(),     // Convert or use current time
      };
      delete processedEventData.id; // Firestore provides the ID

      const docRef = await addDoc(eventsCollectionRef, processedEventData);
      console.log(`Firestore CRUD: Event added with ID: ${docRef.id}`);
      toast({ title: "Event Added", status: "success", duration: 3000, isClosable: true });
    } catch (error) {
      console.error(`Firestore CRUD: Error adding event for user ${userId}:`, error);
      toast({ title: "Error Adding Event", description: error.message, status: "error", duration: 9000, isClosable: true });
    }
  }, [currentUser, toast]);

  const updateEvent = useCallback(async (updatedEvent) => {
     if (!currentUser || !updatedEvent?.id) {
        toast({ title: "Error", description: "Cannot update event - missing user or event ID.", status: "error", duration: 5000, isClosable: true });
        return;
     }
    const userId = currentUser.uid;
    const eventId = updatedEvent.id;
    console.log(`Firestore CRUD: Attempting to update event ${eventId} for user ${userId}`);
    try {
      const eventDocRef = doc(db, 'users', userId, 'events', eventId);
      const dataToUpdate = {
        ...updatedEvent,
        start: updatedEvent.start instanceof Date ? Timestamp.fromDate(updatedEvent.start) : updatedEvent.start,
        end: updatedEvent.end instanceof Date ? Timestamp.fromDate(updatedEvent.end) : updatedEvent.end,
        updatedAt: Timestamp.now() // Add an updated timestamp
      };
      delete dataToUpdate.id; // Don't store the id within the document data

      await updateDoc(eventDocRef, dataToUpdate);
      console.log(`Firestore CRUD: Event ${eventId} updated.`);
      toast({ title: "Event Updated", status: "success", duration: 3000, isClosable: true });
    } catch (error) {
      console.error(`Firestore CRUD: Error updating event ${eventId} for user ${userId}:`, error);
      toast({ title: "Error Updating Event", description: error.message, status: "error", duration: 9000, isClosable: true });
    }
  }, [currentUser, toast]);

  const deleteEvent = useCallback(async (eventId) => {
    if (!currentUser || !eventId) {
        toast({ title: "Error", description: "Cannot delete event - missing user or event ID.", status: "error", duration: 5000, isClosable: true });
        return;
    }
    const userId = currentUser.uid;
     console.log(`Firestore CRUD: Attempting to delete event ${eventId} for user ${userId}`);
    try {
      const eventDocRef = doc(db, 'users', userId, 'events', eventId);
      await deleteDoc(eventDocRef);
      console.log(`Firestore CRUD: Event ${eventId} deleted.`);
      toast({ title: "Event Deleted", status: "success", duration: 3000, isClosable: true });
       setSelectedEvent(null); // Clear selection
       setIsModalOpen(false); // Close modal
    } catch (error) {
      console.error(`Firestore CRUD: Error deleting event ${eventId} for user ${userId}:`, error);
      toast({ title: "Error Deleting Event", description: error.message, status: "error", duration: 9000, isClosable: true });
    }
  }, [currentUser, toast]);

    const addEmployee = useCallback(async (employeeData) => {
        console.log("CalendarContext: addEmployee invoked. currentUser:", currentUser);
        if (!currentUser) {
            console.error("CalendarContext: addEmployee called but currentUser is null.");
            toast({ title: "Error", description: "Cannot add employee - user not logged in.", status: "error", duration: 5000, isClosable: true });
            return;
        }
        const userId = currentUser.uid;
        let newEmployee; // Declare outside try
        console.log(`CalendarContext: Attempting to add employee for user ${userId}`);
        try {
            const employeesCollectionRef = collection(db, 'users', userId, 'employees');
            newEmployee = { // Assign inside try
                userId: userId,
                orgId: 'default-org', // Consider making dynamic
                name: employeeData.name || 'Unnamed Employee',
                email: employeeData.email || null,
                skills: employeeData.skills || [],
                availabilityPatterns: employeeData.availabilityPatterns || [],
                employmentType: employeeData.employmentType || 'unknown',
                shiftPreference: employeeData.shiftPreference || 'any',
                gender: employeeData.gender || 'prefer_not_to_say',
                payRate: employeeData.payRate || null,
                notes: employeeData.notes || '',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };
            const docRef = await addDoc(employeesCollectionRef, newEmployee);
            console.log(`CalendarContext: Successfully added employee with ID: ${docRef.id}. Data:`, newEmployee);
            toast({ title: "Employee Added", status: "success", duration: 3000, isClosable: true });
            setIsEmployeeModalOpen(false); // Close modal
        } catch (error) {
            console.error(`CalendarContext: Firestore error adding employee for user ${userId}:`, error);
            console.error("CalendarContext: Data attempted to save:", newEmployee); // Log the data too
            toast({ title: "Error Adding Employee", description: error.message, status: "error", duration: 9000, isClosable: true });
        }
    }, [currentUser, toast]);

     const updateEmployee = useCallback(async (updatedEmployeeData) => {
         if (!currentUser || !updatedEmployeeData?.id) {
            console.error("CalendarContext: updateEmployee called with missing user or employee ID.", { userId: currentUser?.uid, employeeId: updatedEmployeeData?.id });
            toast({ title: "Error", description: "Cannot update employee - missing user or employee ID.", status: "error", duration: 5000, isClosable: true });
            return;
         }
         const userId = currentUser.uid;
         const employeeId = updatedEmployeeData.id;
         let dataToUpdate; // Declare outside try
         console.log(`CalendarContext: Attempting to update employee ${employeeId} for user ${userId}`);
         try {
             const employeeDocRef = doc(db, 'users', userId, 'employees', employeeId);
             dataToUpdate = { // Assign inside try
                 ...updatedEmployeeData,
                 updatedAt: Timestamp.now(), // Always update timestamp
             };
             delete dataToUpdate.id; // Don't store Firestore ID in the data

             await updateDoc(employeeDocRef, dataToUpdate);
             console.log(`CalendarContext: Successfully updated employee ${employeeId}. Data:`, dataToUpdate);
             toast({ title: "Employee Updated", status: "success", duration: 3000, isClosable: true });
             setIsEmployeeModalOpen(false); // Close modal if it was open for edit
         } catch (error) {
             console.error(`CalendarContext: Firestore error updating employee ${employeeId} for user ${userId}:`, error);
             console.error("CalendarContext: Data attempted to update:", dataToUpdate);
             toast({ title: "Error Updating Employee", description: error.message, status: "error", duration: 9000, isClosable: true });
         }
     }, [currentUser, toast]);

    const deleteEmployee = useCallback(async (employeeId) => {
        if (!currentUser || !employeeId) {
            console.error("CalendarContext: deleteEmployee called with missing user or employee ID.", { userId: currentUser?.uid, employeeId });
            toast({ title: "Error", description: "Cannot delete employee - missing user or employee ID.", status: "error", duration: 5000, isClosable: true });
            return;
        }
        const userId = currentUser.uid;
        console.log(`CalendarContext: Attempting to delete employee ${employeeId} for user ${userId}`);
        try {
            // Potential future enhancement: Check if employee is assigned to events before deleting
            const employeeDocRef = doc(db, 'users', userId, 'employees', employeeId);
            await deleteDoc(employeeDocRef);
            console.log(`CalendarContext: Successfully deleted employee ${employeeId}.`);
            toast({ title: "Employee Deleted", status: "success", duration: 3000, isClosable: true });
            // Close modal if open for this employee?
            if (isEmployeeModalOpen) setIsEmployeeModalOpen(false);
        } catch (error) {
            console.error(`CalendarContext: Firestore error deleting employee ${employeeId} for user ${userId}:`, error);
            toast({ title: "Error Deleting Employee", description: error.message, status: "error", duration: 9000, isClosable: true });
        }
    }, [currentUser, toast, isEmployeeModalOpen]); // Added isEmployeeModalOpen dependency


  // --- UI Helper Functions (Mostly unchanged) ---
  const goToNextMonth = useCallback(() => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  const goToPrevMonth = useCallback(() => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // --- Combined Firestore/UI functions ---
    // assignEmployeeToEvent and moveEventToDate now use updateEvent internally
    const assignEmployeeToEvent = useCallback(async (eventId, employeeId) => {
        const eventToUpdate = events.find(e => e.id === eventId);
        if (eventToUpdate) {
            await updateEvent({ ...eventToUpdate, assignedTo: employeeId || null });
            // Toast handled by updateEvent
        } else {
             toast({ title: "Error", description: "Event not found for assignment.", status: "error", duration: 5000, isClosable: true });
        }
    }, [events, updateEvent, toast]); // Dependencies: events list and updateEvent function

    const moveEventToDate = useCallback(async (eventId, newDate) => {
        const eventToMove = events.find(event => event.id === eventId);
        if (!eventToMove) {
             toast({ title: "Error", description: "Event not found for moving.", status: "error", duration: 5000, isClosable: true });
             return;
        }

        try {
            const currentStart = new Date(eventToMove.start);
            const currentEnd = new Date(eventToMove.end);
            const diff = currentEnd.getTime() - currentStart.getTime();

            const newStart = new Date(newDate);
            // Preserve original time of day
            newStart.setHours(currentStart.getHours(), currentStart.getMinutes(), currentStart.getSeconds(), currentStart.getMilliseconds());
            const newEnd = new Date(newStart.getTime() + diff);

            await updateEvent({ ...eventToMove, start: newStart, end: newEnd });
             // Toast handled by updateEvent
        } catch (error) {
            console.error("Error calculating new dates for move:", error);
            toast({ title: "Error Moving Event", description: "Could not calculate new dates.", status: "error", duration: 9000, isClosable: true });
        }
    }, [events, updateEvent, toast]); // Dependencies: events list and updateEvent function


  // --- Context Value ---
  const value = {
    currentDate,
    events,
    employees,
    selectedEvent,
    selectedEmployee,      // Provide selected employee state
    setSelectedEmployee,   // Provide setter for selected employee
    isModalOpen,
    isEmployeeModalOpen,
    view,
    loadingData,
    currentUser, // Pass user down if needed by components
    setCurrentDate,
    setSelectedEvent,
    setIsModalOpen,
    setIsEmployeeModalOpen,
    setView,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEventToDate,
    goToNextMonth,
    goToPrevMonth,
    goToToday,
    assignEmployeeToEvent,
    addEmployee,
    updateEmployee, // Provide update function
    deleteEmployee, // Provide delete function
  };

  // --- Render Provider ---
  return (
    <CalendarContext.Provider value={value}>
      {/* Optionally show a loading indicator for the whole context */}
      {/* {loadingData && !currentUser ? <div>Loading Auth...</div> : null} */}
      {/* {loadingData && currentUser ? <div>Loading Data...</div> : null} */}
      {children}
    </CalendarContext.Provider>
  );
};
