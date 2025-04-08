import React, { useState, useEffect } from 'react';
import { Box, Button, Input, VStack, Heading, Text, useToast, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { auth } from '../../firebaseConfig'; // Adjust path if needed
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence // Or browserSessionPersistence for session-only login
} from 'firebase/auth';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Attempt to set persistence when the component mounts
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        // Handle errors here, such as when persistence type isn't supported
        console.error("Firebase persistence error:", error.code, error.message);
        toast({
          title: 'Persistence Error',
          description: 'Could not enable offline persistence.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      });
  }, [toast]); // Re-run if toast changes (though unlikely)

  const handleAuth = async (isSignUp) => {
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Account created.',
          description: "We've created your account for you.",
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Logged in.',
          description: "You're successfully logged in.",
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      // Login state is handled by onAuthStateChanged in App.jsx
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: 'Authentication error.',
        description: error.message,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="100vh"
        bg="#202124" // Match AppLayout background
        color="white" // Match AppLayout color
    >
        <Box
            p={8}
            maxWidth="400px"
            borderWidth={1}
            borderRadius="lg"
            boxShadow="lg"
            bg="#2d2e31" // Slightly lighter background for the form card
            w="full" // Ensure box takes up width on smaller screens
        >
            <Tabs isFitted variant="enclosed-colored" colorScheme='blue'>
              <TabList mb="1em">
                <Tab _selected={{ color: 'white', bg: 'brand.blue' }}>Login</Tab>
                <Tab _selected={{ color: 'white', bg: 'brand.green' }}>Sign Up</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  {/* Login Form */}
                  <VStack spacing={4} as="form" onSubmit={(e) => { e.preventDefault(); handleAuth(false); }}>
                      <Heading size="lg" textAlign="center">Login</Heading>
                      <Input
                          placeholder="Email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          isRequired
                          bg="gray.600"
                          borderColor="gray.500"
                          _placeholder={{ color: 'gray.400' }}
                      />
                      <Input
                          placeholder="Password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          isRequired
                          bg="gray.600"
                          borderColor="gray.500"
                          _placeholder={{ color: 'gray.400' }}
                      />
                      <Button
                          type="submit" // Submit form on click
                          colorScheme="blue"
                          width="full"
                          isLoading={isSubmitting}
                          disabled={!email || !password || isSubmitting}
                      >
                          Login
                      </Button>
                  </VStack>
                </TabPanel>
                <TabPanel>
                  {/* Sign Up Form */}
                   <VStack spacing={4} as="form" onSubmit={(e) => { e.preventDefault(); handleAuth(true); }}>
                      <Heading size="lg" textAlign="center">Sign Up</Heading>
                       <Input
                          placeholder="Email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          isRequired
                          bg="gray.600"
                          borderColor="gray.500"
                           _placeholder={{ color: 'gray.400' }}
                      />
                      <Input
                          placeholder="Password (min. 6 characters)"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          isRequired
                           bg="gray.600"
                          borderColor="gray.500"
                           _placeholder={{ color: 'gray.400' }}
                      />
                      <Button
                          type="submit" // Submit form on click
                          colorScheme="green"
                          width="full"
                          isLoading={isSubmitting}
                          disabled={!email || password.length < 6 || isSubmitting}
                      >
                          Sign Up
                      </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
        </Box>
    </Box>
  );
};

export default Auth;
