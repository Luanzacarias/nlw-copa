import { useEffect, useState } from "react";
import { Share } from 'react-native'
import { HStack, useToast, VStack } from "native-base";
import { useRoute } from "@react-navigation/native";

import { api } from "../services/api";

import { Header } from "../components/Header";
import { Loading } from "../components/Loading";
import { PoolCardProps } from "../components/PoolCard";
import { PoolHeader } from "../components/PoolHeader";
import { EmptyMyPoolList } from "../components/EmptyMyPoolList";
import { Option } from "../components/Option";
import { Guesses } from "../components/Guesses";

interface RouteParamsProps {
  id: string;
}

export function Details() {
  
  const [isLoading, setIsLoading] = useState(true);
  const [optionSelected, setOptionSelected] = useState<'guesses' | 'ranking'>('guesses')

  const [poolDetails, setPoolsDetails] = useState<PoolCardProps>({} as PoolCardProps);

  const toast = useToast();
  
  const route = useRoute();
  const { id } = route.params as RouteParamsProps;

  async function fetchPoolDetails(){
    try {
      setIsLoading(true)
      
      const response = await api.get(`/pools/${id}`)
      setPoolsDetails(response.data.pool)
    
    } catch (error) {
      console.log(error)
      
      toast.show({
        title: 'Não foi possível carregar os bolões',
        placement: 'top',
        bgColor: 'red.500'
      })

    } finally {
      setIsLoading(false)
    }
  }

  // função para compartilhamento do bolão 
  async function handleCodeShare() {
    Share.share({
      message: poolDetails.code
    })
  }

  useEffect(() => {
    fetchPoolDetails();
  }, [id]);
  
  if(isLoading) {
    return <Loading />
  }
  return(
    <VStack flex={1} bgColor='gray.900'>
      <Header title={poolDetails.title} showBackButton showShareButton onShare={handleCodeShare} />

      {
        poolDetails._count?.participants > 0 ? 
          <VStack px={5} flex={1} >
            <PoolHeader data={poolDetails} />

            <HStack bg="gray.800" p={1} rounded="sm" mb={5} >
              <Option 
                title="Seus Palpites" 
                isSelected={optionSelected === 'guesses'} 
                onPress={() => setOptionSelected('guesses')}
              />
              <Option 
                title="Ranking do grupo" 
                isSelected={optionSelected === 'ranking'} 
                onPress={() => setOptionSelected('ranking')}
              />
            </HStack>

            <Guesses poolId={poolDetails.id} code={poolDetails.code} />

          </VStack> 
          :
          <EmptyMyPoolList code={poolDetails.code} />
      }
      
    </VStack>
  );
}