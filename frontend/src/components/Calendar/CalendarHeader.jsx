import React from 'react';
import { 
  Flex, 
  Box, 
  IconButton, 
  Text, 
  Button, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem,
  HStack,
  Spacer
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, AddIcon, HamburgerIcon } from '@chakra-ui/icons';
import { useCalendar } from '../../context/CalendarContext';
import { auth } from '../../firebaseConfig'; 
import { signOut } from "firebase/auth"; 

const CalendarHeader = () => {
  const { 
    currentDate, 
    goToNextMonth, 
    goToPrevMonth, 
    goToToday, 
    setView, 
    view,
    setIsModalOpen 
  } = useCalendar();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // You might want to clear context state or redirect here if needed
      console.log("User signed out successfully");
      // The AuthProvider should handle redirecting to login automatically
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle logout errors (e.g., show a toast)
    }
  };

  return (
    <Flex align="center" justify="space-between" p={4} borderBottom="1px solid #5f6368">
      <HStack spacing={4}>
        <Flex align="center">
          <IconButton
            icon={<HamburgerIcon />}
            variant="ghost"
            aria-label="Menu"
          />
          <Box ml={4} display="flex" alignItems="center">
            <Box 
              w="40px" 
              h="40px" 
              bg="blue.500" 
              borderRadius="8px" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              mr={2}
            >
              <Text fontSize="24px">C</Text>
            </Box>
            <Text fontSize="22px" fontWeight="500">Calendar</Text>
          </Box>
        </Flex>
        
        <Button onClick={goToToday} size="sm" colorScheme="blue" variant="outline">
          Today
        </Button>
        
        <HStack>
          <IconButton
            icon={<ChevronLeftIcon />}
            onClick={goToPrevMonth}
            variant="ghost"
            aria-label="Previous month"
          />
          <IconButton
            icon={<ChevronRightIcon />}
            onClick={goToNextMonth}
            variant="ghost"
            aria-label="Next month"
          />
        </HStack>
        
        <Text fontSize="22px" fontWeight="400">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
      </HStack>

      <HStack>
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronLeftIcon transform="rotate(-90deg)" />}>
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </MenuButton>
          <MenuList bg="#2d2e30" borderColor="#5f6368">
            <MenuItem onClick={() => setView('day')} bg="#2d2e30" _hover={{ bg: "#3c4043" }}>
              Day
            </MenuItem>
            <MenuItem onClick={() => setView('week')} bg="#2d2e30" _hover={{ bg: "#3c4043" }}>
              Week
            </MenuItem>
            <MenuItem onClick={() => setView('month')} bg="#2d2e30" _hover={{ bg: "#3c4043" }}>
              Month
            </MenuItem>
          </MenuList>
        </Menu>

        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="blue" 
          variant="solid"
          onClick={() => setIsModalOpen(true)}
        >
          Create
        </Button>

        <Button onClick={handleLogout} colorScheme="red" size="sm" ml={4}>
          Logout
        </Button>

        <Spacer />
      </HStack>
    </Flex>
  );
};

export default CalendarHeader;