import React, { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  Wrap,
  WrapItem,
  CheckboxGroup,
  Checkbox,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  RadioGroup,
  Radio,
  Tooltip,
  Text,
  Stack,
  useToast,
  Select, // Import Select
} from '@chakra-ui/react';
import { useCalendar } from '../../context/CalendarContext';

// Helper function to format Date object for datetime-local input
const formatDateTimeForInput = (date) => {
  if (!date) return '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return ''; // Handle invalid date

    // Adjust for timezone offset to display correctly in local time input
    const timezoneOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = new Date(d.getTime() - timezoneOffset).toISOString().slice(0, 16);
    return localISOTime;
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return '';
  }
};

const EventForm = ({ event, onSave }) => {
  const { employees } = useCalendar(); // Remove addEvent
  const toast = useToast();

  const [formData, setFormData] = useState({
    orgId: 'default-org',
    name: '',
    description: '',
    requiredSkills: [],
    estimatedDurationHours: 1,
    priority: 3,
    status: 'pending',
    dependencies: [],
    start: '',
    deadline: '',
    location: '',
    assignedTo: '', // Add assignedTo state
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const allSkills = [...new Set(employees.flatMap(emp => 
    emp.skills ? emp.skills.map(s => s.skillName || s) : []
  ))];

  useEffect(() => {
    if (event) {
      // Handle potential Firestore Timestamps using .toDate()
      const startDate = event.start?.toDate ? event.start.toDate() : (event.start ? new Date(event.start) : null);
      const endDate = event.end?.toDate ? event.end.toDate() : (event.end ? new Date(event.end) : null);

      setFormData({
        orgId: event.orgId || 'default-org',
        name: event.title || event.name || '',
        description: event.description || '',
        requiredSkills: event.requiredSkills || [],
        estimatedDurationHours: event.estimatedDurationHours || 1,
        priority: event.priority || 3,
        status: event.status || 'pending',
        dependencies: event.dependencies || [],
        start: startDate ? formatDateTimeForInput(startDate) : '',
        deadline: endDate ? formatDateTimeForInput(endDate) : '', // Use 'deadline' for end date
        location: event.location || '',
        assignedTo: event.assignedTo || '', // Populate assignedTo from event
      });
    } else {
      // Reset form for new event
      setFormData({
        orgId: 'default-org',
        name: '',
        description: '',
        requiredSkills: [],
        estimatedDurationHours: 1,
        priority: 3,
        status: 'pending',
        dependencies: [],
        start: '',
        deadline: '',
        location: '',
        assignedTo: '',
      });
    }
  }, [event]); // Rerun effect when event prop changes

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Handle Select separately if needed, but basic value works here
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSkillsChange = (values) => {
    setFormData({
      ...formData,
      requiredSkills: values.map(skill => ({ skillName: skill, minLevel: 1 })),
    });
  };

  const handleDependencyChange = (e) => {
    const value = e.target.value.split(',').map(id => id.trim()).filter(id => id);
    setFormData({
      ...formData,
      dependencies: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic Input Validation
      if (!formData.name.trim()) {
        toast({
          title: "Task name is required",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        // setIsSubmitting(false); // Let finally handle this
        return;
      }

      if (!formData.start) {
        toast({
          title: "Start date is required",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        // setIsSubmitting(false); // Let finally handle this
        return;
      }

      // Create Date objects
      let startDate, endDate;
      try {
        startDate = new Date(formData.start);
        // Calculate end date based on deadline or duration
        endDate = formData.deadline
          ? new Date(formData.deadline)
          : new Date(startDate.getTime() + (formData.estimatedDurationHours * 60 * 60 * 1000));

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format detected.');
        }

      } catch (dateError) {
        console.error("Date parsing error:", dateError);
        toast({
          title: "Invalid date/time format",
          description: "Please check the start and deadline fields.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return; // Stop submission
      }

      if (formData.deadline && endDate <= startDate) {
        toast({
          title: "Deadline must be after start time",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        // setIsSubmitting(false); // Let finally handle this
        return;
      }

      // Prepare data for saving (matching context expectations)
      const eventData = {
        // Use formData fields directly where names match
        ...formData,
        title: formData.name, // Use 'title' as expected by Calendar view
        start: startDate,     // Use Date object
        end: endDate,         // Use Date object
        assignedTo: formData.assignedTo || null, // Ensure null if empty
        // Remove fields not directly part of the event data model if necessary
        // For example, if 'deadline' is only used for calculation:
        // deadline: undefined, // Or delete eventData.deadline;
      };
      // Remove the 'name' field if 'title' is used instead
      delete eventData.name;
      // Optionally remove deadline if it's just for calculation
      delete eventData.deadline;

      console.log("Calling onSave with event data:", eventData);

      // Call the onSave prop passed from the modal index
      onSave(eventData);

      toast({ // Provide feedback in the form itself
        title: event?.id ? "Event Updated" : "Event Added",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Note: Modal closing is handled in the parent (index.jsx)

    } catch (error) {
      // Catch any unexpected errors during data preparation
      console.error("Error preparing event data:", error);
      toast({
        title: "Error saving event",
        description: error.message || "An unexpected error occurred.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      // Ensure submitting state is always reset
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={5} align="stretch" p={4} bg="#2d2e30" borderRadius="md" boxShadow="md">
        <FormControl isRequired>
          <FormLabel color="white">Task Name</FormLabel>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter task name"
            bg="#3c4043"
            border="none"
            _hover={{ bg: "#4d5156" }}
            _focus={{ bg: "#4d5156", boxShadow: "none" }}
            isDisabled={isSubmitting}
          />
        </FormControl>

        <FormControl>
          <FormLabel color="white">Description</FormLabel>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add task description"
            bg="#3c4043"
            border="none"
            _hover={{ bg: "#4d5156" }}
            _focus={{ bg: "#4d5156", boxShadow: "none" }}
            isDisabled={isSubmitting}
          />
        </FormControl>

        <FormControl>
          <FormLabel color="white">Required Skills</FormLabel>
          <CheckboxGroup value={formData.requiredSkills.map(skill => skill.skillName)} onChange={handleSkillsChange}>
            <Wrap spacing={4} shouldWrapChildren>
              {allSkills.map((skill) => (
                <WrapItem key={skill} as="div"> 
                  <Checkbox value={skill} colorScheme="teal" bg="#3c4043" color="white" isDisabled={isSubmitting}>
                    {skill}
                  </Checkbox>
                </WrapItem>
              ))}
            </Wrap>
          </CheckboxGroup>
        </FormControl>

        <FormControl>
          <FormLabel color="white">Estimated Duration (hours)</FormLabel>
          <NumberInput
            name="estimatedDurationHours"
            value={formData.estimatedDurationHours}
            onChange={(value) => setFormData({ ...formData, estimatedDurationHours: parseFloat(value) || 1 })}
            min={0.5}
            max={24}
            step={0.5}
            bg="#3c4043"
            border="none"
            _hover={{ bg: "#4d5156" }}
            _focus={{ bg: "#4d5156", boxShadow: "none" }}
            isDisabled={isSubmitting}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl>
          <FormLabel color="white">Priority (1-5)</FormLabel>
          <NumberInput
            name="priority"
            value={formData.priority}
            onChange={(value) => setFormData({ ...formData, priority: parseInt(value) || 3 })}
            min={1}
            max={5}
            bg="#3c4043"
            border="none"
            _hover={{ bg: "#4d5156" }}
            _focus={{ bg: "#4d5156", boxShadow: "none" }}
            isDisabled={isSubmitting}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Text fontSize="sm" color="gray.400">1 = Lowest, 5 = Highest</Text>
        </FormControl>

        <FormControl>
          <FormLabel color="white">Status</FormLabel>
          <RadioGroup name="status" value={formData.status} onChange={(value) => setFormData({ ...formData, status: value })}>
            <Stack direction="column" spacing={2}>
              <Radio value="pending" colorScheme="gray" isDisabled={isSubmitting}>Pending</Radio>
              <Radio value="assigned" colorScheme="blue" isDisabled={isSubmitting}>Assigned</Radio>
              <Radio value="in-progress" colorScheme="yellow" isDisabled={isSubmitting}>In Progress</Radio>
              <Radio value="completed" colorScheme="green" isDisabled={isSubmitting}>Completed</Radio>
              <Radio value="cancelled" colorScheme="red" isDisabled={isSubmitting}>Cancelled</Radio>
            </Stack>
          </RadioGroup>
        </FormControl>

        <FormControl>
          <FormLabel color="white">Dependencies (comma-separated task IDs)</FormLabel>
          <Tooltip label="Enter task IDs (e.g., 1, 2, 3) that this task depends on">
            <Input
              name="dependencies"
              value={formData.dependencies.join(', ')}
              onChange={handleDependencyChange}
              placeholder="e.g., 1, 2, 3"
              bg="#3c4043"
              border="none"
              _hover={{ bg: "#4d5156" }}
              _focus={{ bg: "#4d5156", boxShadow: "none" }}
              isDisabled={isSubmitting}
            />
          </Tooltip>
        </FormControl>

        <FormControl isRequired>
          <FormLabel color="white">Start Date and Time</FormLabel>
          <Input
            name="start"
            type="datetime-local"
            value={formData.start}
            onChange={handleChange}
            bg="#3c4043"
            border="none"
            _hover={{ bg: "#4d5156" }}
            _focus={{ bg: "#4d5156", boxShadow: "none" }}
            isDisabled={isSubmitting}
          />
        </FormControl>

        <FormControl>
          <FormLabel color="white">Deadline (optional)</FormLabel>
          <Input
            name="deadline"
            type="datetime-local"
            value={formData.deadline}
            onChange={handleChange}
            bg="#3c4043"
            border="none"
            _hover={{ bg: "#4d5156" }}
            _focus={{ bg: "#4d5156", boxShadow: "none" }}
            isDisabled={isSubmitting}
          />
        </FormControl>

        <FormControl>
          <FormLabel color="white">Location (optional)</FormLabel>
          <Input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Conference Room A"
            bg="#3c4043"
            border="none"
            _hover={{ bg: "#4d5156" }}
            _focus={{ bg: "#4d5156", boxShadow: "none" }}
            isDisabled={isSubmitting}
          />
        </FormControl>

        {/* Employee Assignment Dropdown */}
        <FormControl>
          <FormLabel color="white">Assign To</FormLabel>
          <Select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            placeholder="Select Employee (Optional)"
            bg="#3c3d3f" // Slightly lighter background for dropdown
            borderColor="#5f6368"
            _hover={{ borderColor: '#7c7f83' }}
            _focus={{ borderColor: 'blue.500', boxShadow: 'outline' }}
          >
            <option value="">-- Unassigned --</option>
            {employees && employees.length > 0 ? (
              employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))
            ) : (
              <option value="" disabled>Loading employees...</option>
            )}
          </Select>
        </FormControl>

        <Button
          type="submit"
          bg="#1a73e8"
          color="white"
          px={6}
          py={2}
          borderRadius="md"
          _hover={{ bg: "#1765cc" }}
          _active={{ bg: "#1557b0" }}
          transition="all 0.2s"
          mt={4}
          isLoading={isSubmitting}
          loadingText="Saving..."
          isDisabled={isSubmitting} // Prevent multiple clicks
        >
          Save Task
        </Button>
      </VStack>
    </form>
  );
};

export default EventForm;