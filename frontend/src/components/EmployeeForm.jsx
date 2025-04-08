import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  CheckboxGroup,
  Checkbox,
  Stack,
  Textarea,
  Button,
  Switch,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useCalendar } from '../context/CalendarContext';

const EmployeeForm = () => {
  const {
    isEmployeeModalOpen,
    setIsEmployeeModalOpen,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    selectedEmployee,
    setSelectedEmployee,
  } = useCalendar();

  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: [{ skillName: '', level: 1 }],
    availabilityPatterns: [{ type: 'weekly', days: [], startTime: '09:00', endTime: '17:00' }],
    employmentType: 'full-time',
    shiftPreference: 'day',
    gender: 'prefer_not_say',
    payRate: '',
    notes: '',
  });

  useEffect(() => {
    if (isEmployeeModalOpen) {
      if (selectedEmployee) {
        setFormData({
          name: selectedEmployee.name || '',
          email: selectedEmployee.email || '',
          skills: selectedEmployee.skills || [{ skillName: '', level: 1 }],
          availabilityPatterns: selectedEmployee.availabilityPatterns || [{ type: 'weekly', days: [], startTime: '09:00', endTime: '17:00' }],
          employmentType: selectedEmployee.employmentType || 'full-time',
          shiftPreference: selectedEmployee.shiftPreference || 'day',
          gender: selectedEmployee.gender || 'prefer_not_say',
          payRate: selectedEmployee.payRate?.toString() || '',
          notes: selectedEmployee.notes || '',
        });
      } else {
        setFormData({
          name: '',
          email: '',
          skills: [{ skillName: '', level: 1 }],
          availabilityPatterns: [{ type: 'weekly', days: [], startTime: '09:00', endTime: '17:00' }],
          employmentType: 'full-time',
          shiftPreference: 'day',
          gender: 'prefer_not_say',
          payRate: '',
          notes: '',
        });
      }
    }
  }, [selectedEmployee, isEmployeeModalOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSkillChange = (index, field, value) => {
    const newSkills = [...formData.skills];
    newSkills[index][field] = field === 'level' ? Number(value) : value;
    setFormData({ ...formData, skills: newSkills });
  };

  const addSkill = () => {
    setFormData({ ...formData, skills: [...formData.skills, { skillName: '', level: 1 }] });
  };

  const handleAvailabilityChange = (index, field, value) => {
    const newPatterns = [...formData.availabilityPatterns];
    if (field === 'days') {
      newPatterns[index][field] = value.split(',').map(Number).filter(n => n >= 0 && n <= 6);
    } else if (field === 'isAvailable') {
      newPatterns[index][field] = value === 'true';
      if (!value) {
        newPatterns[index].startTime = '';
        newPatterns[index].endTime = '';
      }
    } else {
      newPatterns[index][field] = value;
    }
    setFormData({ ...formData, availabilityPatterns: newPatterns });
  };

  const addAvailability = () => {
    setFormData({
      ...formData,
      availabilityPatterns: [...formData.availabilityPatterns, { type: 'weekly', days: [], startTime: '09:00', endTime: '17:00' }],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Employee name is required.", status: "error", duration: 3000, isClosable: true });
      return;
    }

    const hasValidSkill = formData.skills.some(skill => skill.skillName.trim());
    if (!hasValidSkill) {
      toast({ title: "Error", description: "At least one skill with a name is required.", status: "error", duration: 3000, isClosable: true });
      return;
    }

    const dataToSave = {
      ...formData,
      payRate: formData.payRate ? parseFloat(formData.payRate) : null,
      orgId: "default-org", // Replace with dynamic orgId if available
    };

    console.log("Data to save:", dataToSave);

    try {
      if (selectedEmployee?.id) {
        await updateEmployee({ ...dataToSave, id: selectedEmployee.id });
        toast({ title: "Success", description: "Employee updated successfully.", status: "success", duration: 3000, isClosable: true });
      } else {
        await addEmployee(dataToSave);
        toast({ title: "Success", description: "Employee added successfully.", status: "success", duration: 3000, isClosable: true });
      }
      setIsEmployeeModalOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Failed to save employee:", error);
      toast({ title: "Error", description: `Failed to save employee: ${error.message}`, status: "error", duration: 5000, isClosable: true });
    }
  };

  const handleDelete = async () => {
    if (selectedEmployee?.id) {
      try {
        await deleteEmployee(selectedEmployee.id);
        toast({ title: "Success", description: "Employee deleted successfully.", status: "success", duration: 3000, isClosable: true });
        setIsEmployeeModalOpen(false);
        setSelectedEmployee(null);
      } catch (error) {
        console.error("Failed to delete employee:", error);
        toast({ title: "Error", description: `Failed to delete employee: ${error.message}`, status: "error", duration: 5000, isClosable: true });
      }
    }
  };

  const handleClose = () => {
    setIsEmployeeModalOpen(false);
    setSelectedEmployee(null);
  };

  return (
    <Modal isOpen={isEmployeeModalOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent bg="#2d2e30" color="white">
        <form onSubmit={handleSubmit}>
          <ModalHeader>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input name="name" value={formData.name} onChange={handleChange} bg="#3c4043" />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input name="email" value={formData.email} onChange={handleChange} bg="#3c4043" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Skills</FormLabel>
                {formData.skills.map((skill, index) => (
                  <HStack key={index} spacing={4} mb={2}>
                    <Input
                      placeholder="Skill Name"
                      value={skill.skillName}
                      onChange={(e) => handleSkillChange(index, 'skillName', e.target.value)}
                      bg="#3c4043"
                    />
                    <Select
                      value={skill.level}
                      onChange={(e) => handleSkillChange(index, 'level', e.target.value)}
                      bg="#3c4043"
                    >
                      {[1, 2, 3, 4, 5].map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </Select>
                  </HStack>
                ))}
                <Button onClick={addSkill} size="sm" colorScheme="teal">Add Skill</Button>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Availability Patterns</FormLabel>
                {formData.availabilityPatterns.map((pattern, index) => (
                  <VStack key={index} spacing={2} mb={2} align="stretch">
                    <Select
                      value={pattern.type}
                      onChange={(e) => handleAvailabilityChange(index, 'type', e.target.value)}
                      bg="#3c4043"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="specificDate">Specific Date</option>
                    </Select>
                    {pattern.type === 'weekly' ? (
                      <>
                        <Input
                          placeholder="Days (e.g., 0,1,2 for Mon,Tue,Wed)"
                          value={pattern.days.join(',')}
                          onChange={(e) => handleAvailabilityChange(index, 'days', e.target.value)}
                          bg="#3c4043"
                        />
                        <HStack>
                          <Input
                            placeholder="Start Time (HH:MM)"
                            value={pattern.startTime}
                            onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                            bg="#3c4043"
                          />
                          <Input
                            placeholder="End Time (HH:MM)"
                            value={pattern.endTime}
                            onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                            bg="#3c4043"
                          />
                        </HStack>
                      </>
                    ) : (
                      <>
                        <Input
                          placeholder="Date (YYYY-MM-DD)"
                          value={pattern.date || ''}
                          onChange={(e) => handleAvailabilityChange(index, 'date', e.target.value)}
                          bg="#3c4043"
                        />
                        <HStack>
                          <Switch
                            isChecked={pattern.isAvailable}
                            onChange={(e) => handleAvailabilityChange(index, 'isAvailable', e.target.checked)}
                          />
                          <Text>Available</Text>
                          {pattern.isAvailable && (
                            <>
                              <Input
                                placeholder="Start Time (HH:MM)"
                                value={pattern.startTime || ''}
                                onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                                bg="#3c4043"
                              />
                              <Input
                                placeholder="End Time (HH:MM)"
                                value={pattern.endTime || ''}
                                onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                                bg="#3c4043"
                              />
                            </>
                          )}
                        </HStack>
                      </>
                    )}
                  </VStack>
                ))}
                <Button onClick={addAvailability} size="sm" colorScheme="teal">Add Availability</Button>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Employment Type</FormLabel>
                <Select name="employmentType" value={formData.employmentType} onChange={handleChange} bg="#3c4043">
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="intern">Intern</option>
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Shift Preference</FormLabel>
                <Select name="shiftPreference" value={formData.shiftPreference} onChange={handleChange} bg="#3c4043">
                  <option value="day">Day</option>
                  <option value="night">Night</option>
                  <option value="flexible">Flexible</option>
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Gender</FormLabel>
                <Select name="gender" value={formData.gender} onChange={handleChange} bg="#3c4043">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_say">Prefer Not to Say</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Pay Rate (per hour)</FormLabel>
                <Input
                  name="payRate"
                  type="number"
                  step="0.01"
                  value={formData.payRate}
                  onChange={handleChange}
                  bg="#3c4043"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea name="notes" value={formData.notes} onChange={handleChange} bg="#3c4043" />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="#5f6368">
            {selectedEmployee && (
              <Button colorScheme="red" mr="auto" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose} mr={3}>
              Cancel
            </Button>
            <Button type="submit" colorScheme="blue">
              {selectedEmployee ? 'Save Changes' : 'Add Employee'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default EmployeeForm;