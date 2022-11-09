import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function authRoutes(fastify: FastifyInstance){

  // Rota que retorna informações do user
  // toda vez que essa rota for executada, ele vai executar "authenticate", que valida o token do user
  // se nn tiver autenticado, o código não executa
  fastify.get('/me', {
      onRequest: [authenticate],
    }, async (request) => {
    return { user: request.user }
  })


  fastify.post('/users', async (request) => {

    const createUserBody = z.object({
      access_token: z.string(),
    })

    const { access_token } = createUserBody.parse(request.body);

    // enviando requisição para API do google, com o token gerado quando 
    // o user fez o cadastro com a conta google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      }
    })

    const userData = await userResponse.json();
    // confirmar informações recebidas
    const userInfoSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      picture: z.string().url(),
    })

    const userInfo = userInfoSchema.parse(userData)

    // verificação se o usuário existe
    // caso não exista faz o cadastro
    let user = await prisma.user.findUnique({
      where: {
        googleId: userInfo.id,
      }
    })

    // cria o user caso não tenha
    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          avatarUrl: userInfo.picture
        }
      })
    }

    /* Gerar um cógido jwt para o usuário  que
      servir como identificação nas requisições feitas no app
    */
   // não colocar informações secretas, uma vez que isso não criptografado
    const token = fastify.jwt.sign({
      name: user.name,
      avatarUrl: user.avatarUrl,
    }, {
      // representa quem gerou o token(normalmente o id do usuário)
      sub: user.id,
      expiresIn: '7 days'
    })

    return { token }
  })
}