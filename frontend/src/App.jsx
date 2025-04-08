import React, { useState, useEffect } from 'react';
import { ChakraProvider, extendTheme, Spinner, Center } from '@chakra-ui/react';
import AppLayout from './components/Layout/AppLayout';
import { CalendarProvider } from './context/CalendarContext';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from './components/Auth/Auth';

const theme = extendTheme({
  colors: {
    brand: {
      blue: '#1a73e8',
      lightBlue: '#4285f4',
      green: '#34a853',
      yellow: '#fbbc04',
      red: '#ea4335',
    },
  },
});

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <ChakraProvider theme={theme}>
        <Center h="100vh" bg="#202124">
          <Spinner size="xl" color="white" />
        </Center>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      {currentUser ? (
        <CalendarProvider>
          <AppLayout />
        </CalendarProvider>
      ) : (
        <Auth />
      )}
    </ChakraProvider>
  );
}

export default App;