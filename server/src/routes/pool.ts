import { FastifyInstance } from "fastify";
import ShortUniqueId from "short-unique-id";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function poolRoutes(fastify: FastifyInstance){
  // Rota para acesar a contagem de bolões
  fastify.get('/pools/count', async () => {

    const count = await prisma.pool.count()

    return { count }
  });
  // Rota para a criação de um novo bolão
  fastify.post('/pools', async (request, reply) => {

    const createPoolBody = z.object({
      title: z.string(),
    })

    const { title } = createPoolBody.parse(request.body)

    // gerar o código de 6 dígitos para cada bolão
    const generate = new ShortUniqueId({length: 6});
    const code = String(generate()).toUpperCase();

    // fazer uma verificação pra tornar a criação variável, para web ou mobile
    // web sem owner, mobile com owner
    try {
      await request.jwtVerify();
      // se der certo, tem alguém logado = usando o mobile
      // cria com owner
      await prisma.pool.create({
        data: {
          title,
          code,
          ownerId: request.user.sub, // como foi feita a deficição(@types/fastify-jwt.d.ts) segundo a documentação do fastify-jwt, da certo

          // criar o Participant ao mesmo tempo que cria o bolão
          participants: {
            create: {
              userId: request.user.sub,
            }
          }
        }
      })
    } catch {
      // como não deu certo a verificação de jwt = usando web
      // cria sem owner
      await prisma.pool.create({
        data: {
          title,
          code
        }
      })
    }

    

    // Enviando a resposta de "criado com sucesso"
    return reply.status(201).send({ code })
  });

  // Rota para entrar em um bolão 
  // essa ação precisa que o user esteja logado, faz a verificação na requisição
  fastify.post('/pools/join', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    const joinPoolBody = z.object({
      code: z.string(),
    })

    const { code } = joinPoolBody.parse(request.body);

    // verificar se o bolão existe
    const pool = await prisma.pool.findUnique({
      where: {
        code,
      }, // Verificar se o user já faz parte do bolão não não dar join mais de uma vez
      include: {
        participants: {
          where: {
            userId: request.user.sub,
          }
        }
      }
    })

    // se não exister retorna mensagem de erro
    if (!pool) {
      return reply.status(400).send({
        message: 'Pool not found.'
      })
    }

    // se pool.participants retornou algo, é pq o user já está incluido no bolão
    if(pool.participants.length > 0){
      return reply.status(400).send({
        message: 'You already joined this pool.'
      })
    }

    // se o user estiver tentando acessar o bolão mas ele não tem dono
    // então ele se tornará o dono desse bolão
    if(!pool.ownerId){
      await prisma.pool.update({
        where: {
          id: pool.id
        },
        data: {
          ownerId: request.user.sub
        }
      })
    }

    // se tudo passou, então o bolão existe e o user não está cadstrado nele
    await prisma.participant.create({
      data: {
        poolId: pool.id,
        userId: request.user.sub
      }
    })

    return reply.status(201).send();
  })

  // Rota para acessar os bolões que o user está participando
  // essa ação precisa que o user esteja logado, faz a verificação na requisição
  fastify.get('/pools', {
    onRequest: [authenticate]
  }, async (request) => {
    const pools = await prisma.pool.findMany({
      where: {
        participants: {
          some: {
            userId: request.user.sub
          }
        }
      }, // vai incluir a contagem de participantes + avatares de 4 participantes do bolão + dados sobre ownerId 
      include: {
        _count: {
          select: {
            participants: true,
          }
        },
        participants: {
          select: {
            // pega o id do participants e já faz a relação com a tabela de users pra pegar o avatarUrl
            id: true,

            user: {
              select: {
                avatarUrl: true,
              }
            }
          },
          take: 4,
        },
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return { pools }
  })

  // Rota para pegar detalhes de um bolão especifico
  fastify.get('/pools/:id', {
    onRequest: [authenticate],
  }, async (request) => {
    const getPoolParams = z.object({
      id: z.string()
    })

    const { id } = getPoolParams.parse(request.params)

    const pool = await prisma.pool.findUnique({
      where: {
        id,
      }, // vai incluir a contagem de participantes + avatares de 4 participantes do bolão + dados sobre ownerId 
      include: {
        _count: {
          select: {
            participants: true,
          }
        },
        participants: {
          select: {
            // pega o id do participants e já faz a relação com a tabela de users pra pegar o avatarUrl
            id: true,

            user: {
              select: {
                avatarUrl: true,
              }
            }
          },
          take: 4,
        },
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return { pool }

  })

}