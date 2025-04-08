import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
} from '@chakra-ui/react';
import { useCalendar } from '../../context/CalendarContext';
import EventForm from './EventForm';

const EventModal = () => {
  const { isModalOpen, setIsModalOpen, selectedEvent, addEvent, updateEvent, deleteEvent } = useCalendar();

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (eventData) => {
    if (selectedEvent?.id) {
      await updateEvent({ ...eventData, id: selectedEvent.id });
    } else {
      await addEvent(eventData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (selectedEvent?.id) {
      await deleteEvent(selectedEvent.id);
    }
    setIsModalOpen(false);
  };

  return (
    <Modal isOpen={isModalOpen} onClose={handleClose} size="md">
      <ModalOverlay bg="rgba(0,0,0,0.7)" />
      <ModalContent bg="#2d2e30" color="white" borderRadius="md">
        <ModalHeader borderBottomWidth="1px" borderColor="#5f6368">
          {selectedEvent?.id ? 'Edit Event' : 'Add Event'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <EventForm
            event={selectedEvent}
            onSave={handleSave}
          />
        </ModalBody>
        <ModalFooter borderTopWidth="1px" borderColor="#5f6368">
          {selectedEvent?.id && (
            <Button colorScheme="red" mr={3} onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EventModal;