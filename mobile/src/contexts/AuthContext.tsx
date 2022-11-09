import { createContext, ReactNode, useState, useEffect } from "react";
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

interface UserProps {
  name: string;
  avatarUrl: string;
}

export interface AuthContextDataProps {
  user: UserProps;
  isUserLoading: boolean;
  signIn: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextDataProps);

export function AuthContextProvider({ children }: AuthProviderProps){
  // Guardar infos do user autenticado
  const [user, setUser] = useState<UserProps>({} as UserProps);

  // estado para verificarse o fluxo de contexto está acontecendo
  const [isUserLoading, setIsUserLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: process.env.CLIENT_ID,
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true}),
      scopes: ['profile', 'email']
    })

  // Começar processo de login
  async function signIn() {
    try {
      setIsUserLoading(true)
      await promptAsync();
      
    } catch (err) {
      console.log(err);
      throw err;

    } finally {
      setIsUserLoading(false)
    }
  }

  // Logar com o Google
  // obtém o token de autenticação e faz o processo
  async function signInWithGoogle(access_token: string) {
    try {
      setIsUserLoading(true);
      
      // cadastrar através do token
      const tokenResponse = await api.post('/users', { access_token })
      // enviando o token no header de toda requisição para o user ser identificado no banco de dados
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenResponse.data.token}`

      // pegar dados do user na rota certa e salvar no estado
      const userInfoResponse = await api.get('/me');
      setUser(userInfoResponse.data.user);
      
    } catch (error) {
      console.log(error);
      throw error
    } finally {
      setIsUserLoading(false);
    }
  }

  // Observar quando tiver resposta de autenticação pronta(response)
  useEffect(() => {
    if(response?.type === 'success' && response.authentication?.accessToken) {
      signInWithGoogle(response.authentication.accessToken);
    }
  },[response])


  return(
    <AuthContext.Provider value={{
      signIn,
      isUserLoading,
      user
    }}>
      {children}
    </AuthContext.Provider>
  )
}