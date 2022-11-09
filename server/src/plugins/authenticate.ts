import { FastifyRequest } from "fastify";

export async function authenticate(request: FastifyRequest) {
  // validar o token jwt
  await request.jwtVerify()
}