import React, { useRef, useEffect } from 'react';
import { Box, VStack } from '@chakra-ui/react';
import { useCalendar } from '../../context/CalendarContext';
import EmployeeCard from './EmployeeCard';
import { gsap } from 'gsap';

const EmployeeList = () => {
  const { employees } = useCalendar();
  const containerRef = useRef(null);
  
  useEffect(() => {
    const cards = containerRef.current.querySelectorAll('.employee-card');
    
    gsap.set(cards, { scale: 1 });
    
    cards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          scale: 1.05,
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
          duration: 0.3
        });
      });
      
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          scale: 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          duration: 0.3
        });
      });
    });
    
    return () => {
      cards.forEach((card) => {
        card.removeEventListener('mouseenter', () => {});
        card.removeEventListener('mouseleave', () => {});
      });
    };
  }, [employees]);

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
        {employees.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </VStack>
    </Box>
  );
};

export default EmployeeList;