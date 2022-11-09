import { useState } from "react";
import { Heading, Text, VStack, useToast } from "native-base";

import { api } from "../services/api";

import Logo from '../assets/logo.svg';
import { Button } from "../components/Button";
import { Header } from "../components/Header";
import { Input } from "../components/Input";


export function New() {

  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');

  const toast = useToast();

  // irá fazer a requisição de criação de novo bolão, de acordo com as necessidades do backend
  async function handlePoolCreate(){

    // verificar se há algo escrito no title antes de dar inicio ao processo
    if(!title.trim()) {
      return toast.show({
        title: 'Informe um nome para o seu Bolão',
        placement: 'top',
        bgColor: 'red.500'
      })
    }

    try {
      setIsLoading(true);

      // manda pro backend criar 
      await api.post('/pools', { title: title.toUpperCase() })

      toast.show({
        title: 'Bolão criado com sucesso!',
        placement: 'top',
        bgColor: 'green.500'
      })

      setTitle('');

    } catch (error) {
      console.log(error);

      toast.show({
        title: 'Não foi possível criar o bolão',
        placement: 'top',
        bgColor: 'red.500'
      })
    } finally {
      setIsLoading(false)
    }

  }

  return(
    <VStack flex={1} bgColor='gray.900'>
      <Header title="Criar novo bolão" />

      <VStack mt={8} mx={5} alignItems="center" > 
        <Logo />

        <Heading fontFamily='heading' color='white' fontSize='xl' my={8} textAlign="center" >
          Crie seu próprio bolão da copa{'\n'}e compartilhe entre amigos!
        </Heading>
        
        <Input 
          mb={2}
          placeholder='Qual o nome do seu bolão?'
          onChangeText={setTitle}
          value={title}
        />

        <Button 
          title="CRIAR MEU BOTÃO"
          onPress={handlePoolCreate}
          isLoading={isLoading}
        />

        <Text color="gray.200" fontSize="sm" textAlign="center" px={10} mt={4}>
          Após criar seu bolão, você receberá um código único
          que poderá usar para convidar outras pessoas.
        </Text>

      </VStack>
    </VStack>
  )
}