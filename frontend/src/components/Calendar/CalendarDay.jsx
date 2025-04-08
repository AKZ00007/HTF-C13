import React, { useRef, useEffect } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { useCalendar } from '../../context/CalendarContext';
import CalendarEvent from './CalendarEvent';
import { useDragDrop } from '../../hooks/useDragDrop';

const holidays = {
  '2025-04-01': 'Eid al-Fitr Holiday',
};

const CalendarDay = ({ date, isCurrentMonth, events, calendarDays, onDrop, onDragOver, onDragStart, onDragMove, onDragEnd }) => {
  const { setSelectedEvent, setIsModalOpen } = useCalendar();
  const { onDrop: dropHandler, onDropEmployee, dragStart, dragEnd } = useDragDrop();
  const dayRef = useRef(null);

  const isToday = 
    date.getDate() === new Date().getDate() &&
    date.getMonth() === new Date().getMonth() &&
    date.getFullYear() === new Date().getFullYear();
  
  const holiday = holidays[date.toISOString().split('T')[0]];
  
  const handleDayClick = () => {
    setSelectedEvent({
      title: '',
      start: new Date(date).setHours(9, 0, 0),
      end: new Date(date).setHours(10, 0, 0),
      assignedTo: null,
    });
    setIsModalOpen(true);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    const employeeId = e.dataTransfer.getData('employeeId');
    if (eventId) {
      onDrop(eventId, date);
    } else if (employeeId) {
      onDropEmployee(null, employeeId, date);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    onDragOver(e);
  };

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.button === 0) {
        onDragStart(date);
      }
    };

    const handleMouseMove = (e) => {
      if (dragStart) {
        const rect = dayRef.current.getBoundingClientRect();
        const daysDiff = Math.floor((e.clientX - rect.left) / (rect.width));
        const targetDate = new Date(dragStart);
        targetDate.setDate(dragStart.getDate() + daysDiff);
        onDragMove(targetDate);
      }
    };

    const handleMouseUp = () => {
      onDragEnd();
    };

    const currentRef = dayRef.current;
    if (currentRef) {
      currentRef.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragStart, onDragStart, onDragMove, onDragEnd, date]);

  const isDraggingOver = dragStart && dragEnd && 
    (date >= dragStart && date <= dragEnd || date <= dragStart && date >= dragEnd);

  // Filter out multi-day events to avoid duplicate rendering
  const singleDayEvents = events.filter(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return eventStart.toDateString() === eventEnd.toDateString();
  });

  // Calculate multi-day events for this day
  const multiDayEvents = events.filter(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return eventStart <= date && eventEnd >= date && eventStart.toDateString() !== eventEnd.toDateString();
  });

  return (
    <Box
      ref={dayRef}
      bg={isCurrentMonth ? "#202124" : "#121212"}
      p={2}
      height="100%"
      onClick={handleDayClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      borderRadius="4px"
      position="relative"
      cursor="pointer"
      _hover={{ bg: isCurrentMonth ? "#27282A" : "#1A1A1A" }}
      display="flex"
      flexDirection="column"
      minHeight="0"
    >
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        w="24px"
        h="24px"
        borderRadius="50%"
        bg={isToday ? "#1a73e8" : "transparent"}
        color={isToday ? "white" : isCurrentMonth ? "white" : "#5f6368"}
        mb={2}
        zIndex={2}
      >
        <Text fontSize="sm" fontWeight={isToday ? "bold" : "normal"}>
          {date.getDate()}
        </Text>
      </Box>
      
      <VStack align="stretch" spacing={1} minHeight="0" overflow="hidden">
        {holiday && (
          <Box bg="#34a853" p={1} borderRadius="4px" mb={1}>
            <Text fontSize="xs" color="black">{holiday}</Text>
          </Box>
        )}
        
        {singleDayEvents.map((event, index) => (
          <CalendarEvent key={event.id} event={event} />
        ))}
        
        {multiDayEvents.map((event, index) => {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          const startIndex = calendarDays.findIndex(day => day.date.toDateString() === eventStart.toDateString());
          const endIndex = calendarDays.findIndex(day => day.date.toDateString() === eventEnd.toDateString());
          const currentIndex = calendarDays.findIndex(day => day.date.toDateString() === date.toDateString());
          const span = Math.min(endIndex - startIndex + 1, 7 - (startIndex % 7)); // Limit span to remaining days in row

          if (currentIndex >= startIndex && currentIndex <= endIndex) {
            const cellWidth = dayRef.current ? dayRef.current.offsetWidth : 100; // Default to 100px if ref is null
            const leftOffset = (currentIndex % 7 - startIndex % 7) * (cellWidth / 7);
            const width = Math.min(span * (cellWidth / 7), cellWidth); // Ensure width doesn't exceed cell

            return (
              <Box
                key={event.id}
                bg={getEventColor(event)}
                height="20px"
                borderRadius="4px"
                display="flex"
                alignItems="center"
                paddingLeft={2}
                color="black"
                fontSize="xs"
                fontWeight="medium"
                position="absolute"
                left={`${leftOffset}px`}
                width={`${width}px`}
                zIndex={1}
                overflow="hidden" // Prevent overflow
                whiteSpace="nowrap" // Prevent text wrapping
                textOverflow="ellipsis" // Add ellipsis for overflow
                title={`${new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${event.title}`} // Tooltip for full text
              >
                {`${new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${event.title}`}
              </Box>
            );
          }
          return null;
        })}
        
        {isDraggingOver && (
          <Box
            bg="rgba(255, 99, 71, 0.5)"
            height="20px"
            borderRadius="4px"
            position="relative"
            zIndex={1}
          />
        )}
      </VStack>
    </Box>
  );
};

// Helper function to get event color (reusing logic from CalendarEvent)
const getEventColor = (event) => {
  const { employees } = useCalendar();
  const assignedEmployee = event.assignedTo 
    ? employees.find(emp => emp.id === event.assignedTo) 
    : null;
  if (assignedEmployee?.color) return assignedEmployee.color;
  if (event.type === 'workout') return '#fbbc04';
  if (event.type === 'meeting') return '#4285f4';
  if (event.type === 'task') return '#34a853';
  return '#f4b400'; // Default color if none match
};

export default CalendarDay;