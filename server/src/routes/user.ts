import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function userRoutes(fastify: FastifyInstance){
  // Rota para contagem de participantes do bolão
  fastify.get('/users/count', async () => {

    const count = await prisma.user.count()

    return { count }
  });
}