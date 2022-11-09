import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function gameRoutes(fastify: FastifyInstance){
  
  // Rota para pegar os Games
  fastify.get('/pools/:id/games', {
    onRequest: [authenticate],
  }, async (request) => {
    const getPoolParams = z.object({
      id: z.string()
    })

    const { id } = getPoolParams.parse(request.params)

    const games = await prisma.game.findMany({
      orderBy: {
        date: 'desc'
      }, 
      // vai incluir o relacionamento de palpites, onde busca somente os palpites do user naquele bolão em específico
      include: {
        guesses: {
          where: {
            participant: {
              userId: request.user.sub,
              poolId: id
            }
          }
        }
      }

    })

    return { 
      // nn vai devolver o array de games sem tratamento, uma vez que vai ser devolvido um array de guesses
      // porém o user só pode fazer um paltipe uma vez
      games: games.map(game => {
        return {
          ...game,
          // guesses transforma-se no guess que tem a informação do palpite, caso já tenha sido feita
          guess: game.guesses.length > 0 ? game.guesses[0] : null,
          guesses: undefined
        }
      })
     }
  })
}