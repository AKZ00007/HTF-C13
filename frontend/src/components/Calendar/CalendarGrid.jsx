import React, { useEffect, useState } from 'react';
import { Box, Grid, GridItem, Text } from '@chakra-ui/react';
import { useCalendar } from '../../context/CalendarContext';
import { Spinner, Center } from '@chakra-ui/react'; 
import CalendarDay from './CalendarDay';
import { getDaysInMonth, getFirstDayOfMonth } from '../../utils/dateUtils';
import { useDragDrop } from '../../hooks/useDragDrop';

const CalendarGrid = ({ view }) => {
  const { currentDate, events, loadingData } = useCalendar(); 
  const [calendarDays, setCalendarDays] = useState([]);
  const { onDrop, onDropEmployee, onDragStart, onDragMove, onDragEnd } = useDragDrop();

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (view === 'month') {
      const daysInMonth = getDaysInMonth(year, month);
      const firstDayOfMonth = getFirstDayOfMonth(year, month);
      
      const prevMonthDays = [];
      if (firstDayOfMonth > 0) {
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevMonthYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
        
        for (let i = 0; i < firstDayOfMonth; i++) {
          const day = daysInPrevMonth - firstDayOfMonth + i + 1;
          prevMonthDays.push({
            date: new Date(prevMonthYear, prevMonth, day),
            isCurrentMonth: false
          });
        }
      }
      
      const currentMonthDays = [];
      for (let i = 1; i <= daysInMonth; i++) {
        currentMonthDays.push({
          date: new Date(year, month, i),
          isCurrentMonth: true
        });
      }
      
      const nextMonthDays = [];
      const totalDaysDisplayed = prevMonthDays.length + currentMonthDays.length;
      const remainingDays = 42 - totalDaysDisplayed;
      
      if (remainingDays > 0) {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextMonthYear = month === 11 ? year + 1 : year;
        
        for (let i = 1; i <= remainingDays; i++) {
          nextMonthDays.push({
            date: new Date(nextMonthYear, nextMonth, i),
            isCurrentMonth: false
          });
        }
      }
      
      setCalendarDays([...prevMonthDays, ...currentMonthDays, ...nextMonthDays]);
    } else if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return { date, isCurrentMonth: date.getMonth() === month };
      });
      setCalendarDays(weekDays);
    } else if (view === 'day') {
      setCalendarDays([{ date: new Date(currentDate), isCurrentMonth: true }]);
    }
  }, [currentDate, view]);

  const getEventsForDay = (date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        (eventStart.getDate() <= date.getDate() && eventEnd.getDate() >= date.getDate()) &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    const employeeId = e.dataTransfer.getData('employeeId');
    if (eventId) {
      onDrop(eventId, targetDate);
    } else if (employeeId) {
      onDropEmployee(null, employeeId, targetDate); // Create new event with employee
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <Box flex="1" overflow="hidden" display="flex" flexDirection="column">
      <Grid templateColumns="repeat(7, 1fr)" textAlign="center" py={2} borderBottom="1px solid #5f6368" bg="#202124">
        <GridItem><Text fontSize="sm" fontWeight="medium" color="white">SUN</Text></GridItem>
        <GridItem><Text fontSize="sm" fontWeight="medium" color="white">MON</Text></GridItem>
        <GridItem><Text fontSize="sm" fontWeight="medium" color="white">TUE</Text></GridItem>
        <GridItem><Text fontSize="sm" fontWeight="medium" color="white">WED</Text></GridItem>
        <GridItem><Text fontSize="sm" fontWeight="medium" color="white">THU</Text></GridItem>
        <GridItem><Text fontSize="sm" fontWeight="medium" color="white">FRI</Text></GridItem>
        <GridItem><Text fontSize="sm" fontWeight="medium" color="white">SAT</Text></GridItem>
      </Grid>

      {loadingData ? (
        <Center flex="1" h="100%">
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : (
        <Grid
          templateColumns={view === 'day' ? '1fr' : 'repeat(7, 1fr)'}
          templateRows={view === 'month' ? 'repeat(6, 1fr)' : '1fr'}
          gap="1px"
          flex="1"
          overflow="auto"
          bg="#5f6368"
          h="100%"
        >
          {calendarDays.map((day, index) => (
            <CalendarDay
              key={index}
              date={day.date}
              isCurrentMonth={day.isCurrentMonth}
              events={getEventsForDay(day.date)}
              calendarDays={calendarDays}
              onDrop={(e) => handleDrop(e, day.date)}
              onDragOver={handleDragOver}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
            />
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default CalendarGrid;