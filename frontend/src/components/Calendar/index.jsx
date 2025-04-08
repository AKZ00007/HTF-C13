import React from 'react';
import { Box } from '@chakra-ui/react';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import { useCalendar } from '../../context/CalendarContext';
import { useDragDrop } from '../../hooks/useDragDrop';

const Calendar = () => {
  const { view } = useCalendar();
  const { onDrop, onDropEmployee, onDragStart, onDragMove, onDragEnd } = useDragDrop();

  return (
    <Box h="100%" display="flex" flexDir="column">
      <CalendarHeader />
      <CalendarGrid
        view={view}
        onDrop={onDrop}
        onDropEmployee={onDropEmployee}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    </Box>
  );
};

export default Calendar;