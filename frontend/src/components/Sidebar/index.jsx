import React from 'react';
import {
  Box,
  Button,
  VStack,
  Heading,
  Divider,
  IconButton,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import EmployeeList from './EmployeeList';
import TaskList from './TaskList';
import { useCalendar } from '../../context/CalendarContext.jsx';

const Sidebar = () => {
  const { setIsEmployeeModalOpen, setIsModalOpen } = useCalendar();

  return (
    <Box
      w="320px" // Widened from 250px
      h="100%"
      bg="#202124"
      borderRight="1px solid #5f6368"
      p={4}
      position="relative"
      color="white"
    >
      <VStack align="stretch" spacing={6}>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="teal"
          variant="solid"
          size="md"
          onClick={() => setIsEmployeeModalOpen(true)}
        >
          Add Employee
        </Button>

        <Button
          leftIcon={<AddIcon />}
          colorScheme="green"
          variant="solid"
          size="md"
          onClick={() => setIsModalOpen(true)} // Triggers EventModal for tasks
        >
          Add Task
        </Button>

        <Box>
          <Heading size="sm" mb={2}>
            April 2025
          </Heading>
          {/* Mini Calendar can be added here */}
        </Box>

        <Divider borderColor="#5f6368" />

        <VStack align="stretch" spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Heading size="sm">Employees</Heading>
            <IconButton
              icon={<AddIcon />}
              size="sm"
              variant="ghost"
              aria-label="Add employee"
              onClick={() => setIsEmployeeModalOpen(true)}
            />
          </Box>
          <EmployeeList />
        </VStack>

        <Divider borderColor="#5f6368" />

        <VStack align="stretch" spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Heading size="sm">Tasks</Heading>
            <IconButton
              icon={<AddIcon />}
              size="sm"
              variant="ghost"
              aria-label="Add task"
              onClick={() => setIsModalOpen(true)}
            />
          </Box>
          <TaskList />
        </VStack>
      </VStack>
    </Box>
  );
};

export default Sidebar;