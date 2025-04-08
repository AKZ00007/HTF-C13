import React, { useRef, useEffect } from 'react';
import { Box, Text, VStack, Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverBody, PopoverArrow, PopoverCloseButton, HStack } from '@chakra-ui/react';
import { useCalendar } from '../../context/CalendarContext.jsx';
import { gsap } from 'gsap';

const TaskList = () => {
  const { events, employees } = useCalendar();
  const containerRef = useRef(null);

  useEffect(() => {
    const cards = containerRef.current.querySelectorAll('.task-card');

    gsap.set(cards, { scale: 1 });

    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          scale: 1.05,
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
          duration: 0.3,
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          scale: 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          duration: 0.3,
        });
      });
    });

    return () => {
      cards.forEach((card) => {
        card.removeEventListener('mouseenter', () => {});
        card.removeEventListener('mouseleave', () => {});
      });
    };
  }, [events]);

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline';
    return new Date(deadline).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <Box
      ref={containerRef}
      h="300px"
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          width: '10px',
          background: '#2d2e30',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#5f6368',
          borderRadius: '24px',
        },
      }}
    >
      <VStack spacing={2} align="stretch">
        {events.map((task) => (
          <Popover key={task.id}>
            <PopoverTrigger>
              <Box
                className="task-card"
                bg="#3c4043"
                p={2}
                borderRadius="md"
                cursor="pointer"
              >
                <HStack justify="space-between">
                  <Text fontSize="sm" color="white">{task.title}</Text>
                  <Text fontSize="xs" color="gray.400">{formatDeadline(task.end)}</Text>
                </HStack>
              </Box>
            </PopoverTrigger>
            <PopoverContent bg="#2d2e30" borderColor="#5f6368">
              <PopoverArrow bg="#2d2e30" />
              <PopoverCloseButton />
              <PopoverHeader borderBottomColor="#5f6368">
                <Text fontWeight="bold" color="white">{task.title}</Text>
              </PopoverHeader>
              <PopoverBody>
                <VStack align="stretch" spacing={2}>
                  <Box>
                    <Text fontWeight="medium" color="white">Status:</Text>
                    <Text fontSize="sm" color="gray.300">{task.status || 'Not Started'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" color="white">Assigned To:</Text>
                    <Text fontSize="sm" color="gray.300">
                      {task.assignedTo ? employees.find(emp => emp.id === task.assignedTo)?.name : 'Unassigned'}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" color="white">Required Skills:</Text>
                    <VStack align="start" spacing={1}>
                      {(task.requiredSkills || []).map((skill, index) => (
                        <Text key={index} fontSize="sm" color="gray.300">
                          {skill.skillName} (Level: {skill.level || 'N/A'})
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" color="white">Deadline:</Text>
                    <Text fontSize="sm" color="gray.300">{formatDeadline(task.end)}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" color="white">Location:</Text>
                    <Text fontSize="sm" color="gray.300">{task.location || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" color="white">Created At:</Text>
                    <Text fontSize="sm" color="gray.300">{new Date(task.start).toLocaleDateString()}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="medium" color="white">Updated At:</Text>
                    <Text fontSize="sm" color="gray.300">{new Date(task.end).toLocaleDateString()}</Text>
                  </Box>
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        ))}
      </VStack>
    </Box>
  );
};

export default TaskList;