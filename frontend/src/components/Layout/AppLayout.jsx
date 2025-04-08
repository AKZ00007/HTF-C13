import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Calendar from '../Calendar';
import Sidebar from '../Sidebar';
import EventModal from '../EventModal';
import EmployeeForm from '../EmployeeForm';
import { useCalendar } from '../../context/CalendarContext';

const AppLayout = () => {
  const { isModalOpen, isEmployeeModalOpen } = useCalendar();

  return (
    <Flex h="100vh" w="100vw" bg="#202124" color="white" overflow="hidden">
      <Sidebar w="250px" />
      <Box flex="1" overflow="auto">
        <Calendar h="100%" />
      </Box>
      {isModalOpen && <EventModal />}
      {isEmployeeModalOpen && <EmployeeForm />}
    </Flex>
  );
};

export default AppLayout;