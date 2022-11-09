import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function guessRoutes(fastify: FastifyInstance){

  // Rota para contagem de palpites
  fastify.get('/guesses/count', async () => {

    const count = await prisma.guess.count()

    return { count }
  });

  // Rota para criar um palpite
  // essa ação precisa que o user esteja logado, faz a verificação na requisição
  fastify.post('/pools/:poolId/games/:gameId/guesses', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    // informações da url, direciona para o game do bolão específico
    const createGuessParams = z.object({
      poolId: z.string(),
      gameId: z.string(),
    })

    // informações para o palpite
    const createGuessBody = z.object({
      firstTeamPoints: z.number(),
      secondTeamPoints: z.number(),
    })

    const { poolId, gameId } = createGuessParams.parse(request.params);
    const { firstTeamPoints, secondTeamPoints } = createGuessBody.parse(request.body);

    // validações
    // procurar um participante através da chave única poolId_userId
    const participant = await prisma.participant.findUnique({
      where: {
        userId_poolId: {
          poolId,
          userId: request.user.sub
        }
      }
    })

    // se não existir, o user não faz parte do bolão
    if(!participant) {
      return reply.status(400).send({
        message: "You're not allowed to create a guess inside this pool."
      })
    }

    // já existe um palpite desse user nesse game?
    // encontra pela chave única
    const guess = await prisma.guess.findUnique({
      where: {
        participantId_gameId: {
          participantId: participant.id,
          gameId
        }
      }
    })

    // se já tem palpite, não deixa criar outros
    if (guess) {
      return reply.status(400).send({
        message: "You already send a guess to this game on this pool."
      })
    }

    // existe game?
    const game = await prisma.game.findUnique({
      where: {
        id: gameId
      }
    })

    // não tem game com esse id
    if (!game) {
      return reply.status(400).send({
        message: "Game not found."
      })
    }

    // se a data do game já tiver passada, não pode fazer novo palpite
    if (game.date < new Date()) {
      return reply.status(400).send({
        message: "You cannot send guesses after the game date."
      })
    
    }

    // se passou por todas as verificações, cria o palpite
    await prisma.guess.create({
      data: {
        gameId,
        participantId: participant.id,
        firstTeamPoints,
        secondTeamPoints
      }
    })

    return reply.status(201).send({})

  })

}