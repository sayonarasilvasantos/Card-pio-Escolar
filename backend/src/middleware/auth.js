import jwt from "jsonwebtoken"
import { HttpError } from "../utils/http-error.js"

export function requireAuth(request, response, next) {
  const [scheme, token] = (request.headers.authorization || "").split(" ")
  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Faça login para continuar.", "UNAUTHENTICATED"))
  }

  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET)
    request.user = { id: claims.sub, role: claims.role }
    next()
  } catch {
    next(new HttpError(401, "Sessão inválida ou expirada.", "UNAUTHENTICATED"))
  }
}

export function requireAdmin(request, response, next) {
  if (request.user?.role !== "administrador") {
    return next(new HttpError(403, "Apenas administradores podem alterar o cardápio.", "FORBIDDEN"))
  }
  next()
}
