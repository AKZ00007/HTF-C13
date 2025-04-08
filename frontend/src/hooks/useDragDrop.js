import { useCallback, useState } from 'react';
import { useCalendar } from '../context/CalendarContext';

export const useDragDrop = () => {
  const { moveEventToDate, assignEmployeeToEvent, addEvent, events, employees } = useCalendar();
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);

  const onDragStart = useCallback((startDate) => {
    setDragStart(startDate);
  }, []);

  const onDragMove = useCallback((endDate) => {
    setDragEnd(endDate);
  }, []);

  const onDragEnd = useCallback(async () => {
    if (dragStart && dragEnd) {
      const start = new Date(Math.min(dragStart.getTime(), dragEnd.getTime()));
      const end = new Date(Math.max(dragStart.getTime(), dragEnd.getTime()));
      start.setHours(9, 0, 0);
      end.setHours(17, 0, 0);

      const newEvent = {
        title: 'New Task',
        start: start,
        end: end,
        type: 'task',
        assignedTo: null,
        requiredSkills: [], 
      };
      try {
        await addEvent(newEvent); 
      } catch (error) {
        console.error("Failed to add event on drag end:", error);
        // Handle error (e.g., show toast)
      }
    }
    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, dragEnd, addEvent]);

  const onDrop = useCallback(async (eventId, targetDate) => {
    if (eventId) {
      try {
        await moveEventToDate(eventId, targetDate); 
      } catch (error) {
        console.error("Failed to move event on drop:", error);
        // Handle error
      }
    }
  }, [moveEventToDate]);

  const onDropEmployee = useCallback(async (eventId, employeeId, targetDate) => {
    const event = events.find(e => e.id === eventId) || (targetDate && {
      title: `Task for ${employeeId}`, 
      start: new Date(new Date(targetDate).setHours(9, 0, 0)), 
      end: new Date(new Date(targetDate).setHours(10, 0, 0)),   
      type: 'task',
      assignedTo: null,
      requiredSkills: [],
    });
    const employee = employees.find(emp => emp.id === employeeId);

    if (event && employee) {
      const employeeSkills = employee.skills.map(s => s.skillName || s); 
      const hasRequiredSkills = event.requiredSkills.every(skill => 
        employeeSkills.includes(skill) || !skill
      );
      if (hasRequiredSkills || !event.requiredSkills.length) {
        if (eventId) {
          try {
            await assignEmployeeToEvent(eventId, employeeId); 
          } catch (error) {
            console.error(`Failed to assign employee ${employeeId} to event ${eventId}:`, error);
            // Handle error
          }
        } else {
          const newEvent = { ...event, assignedTo: employeeId };
          try {
            await addEvent(newEvent); 
          } catch (error) {
            console.error(`Failed to add new event for employee ${employeeId}:`, error);
            // Handle error
          }
        }
      } else {
        alert(`Employee ${employee.name} does not have the required skills: ${event.requiredSkills.join(', ')}`);
      }
    }
  }, [assignEmployeeToEvent, addEvent, events, employees]);

  return { onDrop, onDropEmployee, onDragStart, onDragMove, onDragEnd, dragStart, dragEnd };
};