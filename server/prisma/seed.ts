// Popular o banco de dados para facilitar os testes e usabilidade do front durante desenvolvimento
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(){
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@exemple.com',
      avatarUrl: 'https://github.com/diego3g.png',
    }
  })

  const pool = await prisma.pool.create({
    data:{
      title: 'Exemple Pool',
      code: 'BOL123',
      ownerId: user.id,

      participants: {
        create: {
          userId: user.id,
        }
      }
    }
  })

  // Duas formas de fazer com que o dono da pool também participe da pool
  /*
    const participant = await prisma.participant.create({
      data: {
        userId: user.id,
        poolId: pool.id,
      }
    }) 
  */
 // Ou já adicionando o participant dentro de participants na própria pool(isso que foi feito)

  await prisma.game.create({
    data: {
      date: '2022-11-02T00:00:00.404Z',
      firstTeamCountryCode: 'DE',
      secondTeamCountryCode: 'BR',
    }
  })
  
  await prisma.game.create({
    data: {
      date: '2022-11-03T00:00:00.404Z',
      firstTeamCountryCode: 'BR',
      secondTeamCountryCode: 'AR',

      guesses: {
        create: {
          firstTeamPoints: 2,
          secondTeamPoints: 1,
          // gameId já vai estar associado, uma vez que ta sendo criado ao mesmo tempo, no mesmo local
          participant: {
            connect: {
              userId_poolId: {
                userId: user.id,
                poolId: pool.id
              }
            }
          }
        }
      }
    }
  })

}

main()