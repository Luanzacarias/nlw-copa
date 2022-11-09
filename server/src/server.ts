import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';

import { poolRoutes } from './routes/pool';
import { userRoutes } from './routes/user';
import { guessRoutes } from './routes/guess';
import { gameRoutes } from './routes/game';
import { authRoutes } from './routes/auth';

async function bootstrap(){
  const fastify = Fastify({
    logger: true,
  })

  await fastify.register(cors, {
    origin: true,
  })

  /* Gerar um cógido jwt para o usuário  que
    servir como identificação nas requisições feitas no app
  */
  // EM PRODUÇÃO "secret" PRECISA SER UMA VARIÁVEL AMBIENTE(.env)
  await fastify.register(jwt, {
    // qualquer string, ideal criar um token seguro
    secret: 'nlwcopa',
  })

  // Rotas sendo registradas 
  await fastify.register(poolRoutes);
  await fastify.register(userRoutes);
  await fastify.register(guessRoutes);
  await fastify.register(gameRoutes);
  await fastify.register(authRoutes);


  await fastify.listen({ port:3333, host: '0.0.0.0' })
}

bootstrap();