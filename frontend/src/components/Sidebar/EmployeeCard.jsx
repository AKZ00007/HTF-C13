import React, { useRef } from 'react';
import { 
  Box, 
  Text, 
  Badge, 
  useDisclosure, 
  Popover, 
  PopoverTrigger, 
  PopoverContent, 
  PopoverHeader, 
  PopoverBody, 
  PopoverArrow, 
  PopoverCloseButton,
  HStack,
  Avatar,
  VStack,
} from '@chakra-ui/react';
import { gsap } from 'gsap';

const EmployeeCard = ({ employee }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardRef = useRef(null);
  
  const handleDragStart = (e) => {
    e.dataTransfer.setData('employeeId', employee.id);
    gsap.to(cardRef.current, {
      scale: 1.1,
      boxShadow: '0 12px 24px rgba(0,0,0,0.4)',
      duration: 0.2
    });
  };
  
  const handleDragEnd = () => {
    gsap.to(cardRef.current, {
      scale: 1,
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      duration: 0.3
    });
  };

  const employeeColor = employee.color || '#4285f4';

  const formatAvailability = (patterns) => {
    if (!patterns) return 'No availability data';
    return patterns.map(pattern => {
      if (pattern.type === 'weekly') {
        const days = pattern.days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ');
        return `${days}: ${pattern.startTime} - ${pattern.endTime}`;
      } else {
        return `${pattern.date}: ${pattern.isAvailable ? `Available ${pattern.startTime || ''}-${pattern.endTime || ''}` : 'Not Available'}`;
      }
    }).join('; ');
  };

  return (
    <Box
      ref={cardRef}
      className="employee-card"
      bg="#3c4043"
      borderRadius="md"
      p={3}
      boxShadow="0 2px 4px rgba(0,0,0,0.2)"
      cursor="grab"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onOpen}
      borderLeft={`4px solid ${employeeColor}`}
    >
      <HStack>
        <Avatar size="sm" name={employee.name} bg={employeeColor} />
        <Box>
          <Text fontWeight="medium" color="white">{employee.name}</Text>
          <HStack mt={1}>
            {employee.skills.slice(0, 2).map((skill, i) => (
              <Badge key={i} colorScheme={getBadgeColor(i)} size="sm" color="white">
                {skill.skillName || skill} {/* Render skillName or fallback to skill if skillName is undefined */}
              </Badge>
            ))}
            {employee.skills.length > 2 && (
              <Badge size="sm" variant="outline" color="white">
                +{employee.skills.length - 2}
              </Badge>
            )}
          </HStack>
        </Box>
      </HStack>

      <Popover isOpen={isOpen} onClose={onClose} placement="right">
        <PopoverTrigger>
          <Box display="none" />
        </PopoverTrigger>
        <PopoverContent bg="#3c4043" borderColor="#5f6368">
          <PopoverArrow bg="#3c4043" />
          <PopoverCloseButton />
          <PopoverHeader borderBottomColor="#5f6368">
            <HStack>
              <Avatar size="md" name={employee.name} bg={employeeColor} />
              <Box>
                <Text fontWeight="bold" color="white">{employee.name}</Text>
                <Text fontSize="sm" opacity={0.8} color="white">{employee.position || 'N/A'}</Text>
              </Box>
            </HStack>
          </PopoverHeader>
          <PopoverBody>
            <VStack align="stretch" spacing={3}>
              <Box>
                <Text fontWeight="medium" mb={1} color="white">Skills:</Text>
                <HStack flexWrap="wrap" gap={1}>
                  {employee.skills.map((skill, i) => (
                    <Badge key={i} colorScheme={getBadgeColor(i)} size="sm" color="white">
                      {skill.skillName || skill} (Level: {skill.level || 'N/A'})
                    </Badge>
                  ))}
                </HStack>
              </Box>
              <Box>
                <Text fontWeight="medium" mb={1} color="white">Availability:</Text>
                <Text fontSize="sm" color="white">{formatAvailability(employee.availabilityPatterns)}</Text>
              </Box>
              <Box>
                <Text fontWeight="medium" mb={1} color="white">Employment Type:</Text>
                <Text fontSize="sm" color="white">{employee.employmentType}</Text>
              </Box>
              <Box>
                <Text fontWeight="medium" mb={1} color="white">Shift Preference:</Text>
                <Text fontSize="sm" color="white">{employee.shiftPreference}</Text>
              </Box>
              <Box>
                <Text fontWeight="medium" mb={1} color="white">Gender:</Text>
                <Text fontSize="sm" color="white">{employee.gender}</Text>
              </Box>
              {employee.payRate && (
                <Box>
                  <Text fontWeight="medium" mb={1} color="white">Pay Rate:</Text>
                  <Text fontSize="sm" color="white">{employee.payRate}</Text>
                </Box>
              )}
              {employee.notes && (
                <Box>
                  <Text fontWeight="medium" mb={1} color="white">Notes:</Text>
                  <Text fontSize="sm" color="white">{employee.notes}</Text>
                </Box>
              )}
              <Box>
                <Text fontWeight="medium" mb={1} color="white">Created At:</Text>
                <Text fontSize="sm" color="white">{new Date(employee.createdAt).toLocaleDateString()}</Text>
              </Box>
              <Box>
                <Text fontWeight="medium" mb={1} color="white">Updated At:</Text>
                <Text fontSize="sm" color="white">{new Date(employee.updatedAt).toLocaleDateString()}</Text>
              </Box>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};

const getBadgeColor = (index) => {
  const colors = ['blue', 'green', 'purple', 'orange', 'cyan', 'pink'];
  return colors[index % colors.length];
};

export default EmployeeCard;