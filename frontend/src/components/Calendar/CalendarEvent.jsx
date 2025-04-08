import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { useCalendar } from '../../context/CalendarContext';

const CalendarEvent = ({ event }) => {
  const { setSelectedEvent, setIsModalOpen, employees } = useCalendar();
  
  const handleEventClick = (e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsModalOpen(true);
  };
  
  const handleDragStart = (e) => {
    e.dataTransfer.setData('eventId', event.id);
  };

  const assignedEmployee = event.assignedTo 
    ? employees.find(emp => emp.id === event.assignedTo) 
    : null;
  
  const getEventColor = () => {
    // Prioritize the assigned employee's color
    if (assignedEmployee?.color) return assignedEmployee.color;
    // Fallback to event type colors
    if (event.type === 'workout') return '#fbbc04'; // Yellow
    if (event.type === 'meeting') return '#4285f4'; // Blue
    if (event.type === 'task') return '#34a853'; // Green
    return '#4285f4'; // Default blue
  };

  return (
    <Box
      bg={getEventColor()}
      p={1}
      borderRadius="4px"
      mb={1}
      cursor="grab"
      onClick={handleEventClick}
      draggable
      onDragStart={handleDragStart}
      _hover={{ opacity: 0.9 }}
    >
      {event.allDay ? (
        <Text fontSize="xs" fontWeight="medium" noOfLines={1} color="black">
          {event.title}
        </Text>
      ) : (
        <>
          <Text fontSize="xs" fontWeight="medium" noOfLines={1} color="black">
            {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {event.title}
          </Text>
          {assignedEmployee && (
            <Text fontSize="10px" opacity={0.8} noOfLines={1} color="black">
              {assignedEmployee.name}
            </Text>
          )}
        </>
      )}
    </Box>
  );
};

export default CalendarEvent;