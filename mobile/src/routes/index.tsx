// Este arquivo servirá para eviar as rotas disponíveis de acordo com uma condição
// user logado ou não

import { NavigationContainer } from '@react-navigation/native';
import { Box } from 'native-base';

import { useAuth } from '../hooks/useAuth';

import { SignIn } from '../screens/SignIn';
import { AppRoutes } from './app.routes';

export function Routes() {

  const { user } = useAuth();

  // box pra evitar um glitch entre navegações das rotas
  return(
    <Box flex={1} bg="gray.900">  
      <NavigationContainer>
        { // se o user tiver autenticado ele terá um nome e assim será identificado.
          user.name ? <AppRoutes/> : <SignIn />
        }
      </NavigationContainer>
    </Box>
  )
}