import { ZodError } from "zod"
import { HttpError } from "../utils/http-error.js"

export function notFound(request, response) {
  response.status(404).json({
    error: { code: "NOT_FOUND", message: "Rota não encontrada." },
  })
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error)

  if (error.type === "entity.parse.failed") {
    return response.status(400).json({
      error: { code: "INVALID_JSON", message: "O corpo da requisição não contém JSON válido." },
    })
  }

  if (error.type === "entity.too.large") {
    return response.status(413).json({
      error: { code: "PAYLOAD_TOO_LARGE", message: "A requisição excede o limite permitido." },
    })
  }

  if (error instanceof ZodError) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: error.issues[0]?.message || "Dados inválidos.",
      },
    })
  }

  if (error instanceof HttpError) {
    return response.status(error.status).json({
      error: { code: error.code, message: error.message },
    })
  }

  if (error.code === "23505") {
    return response.status(409).json({
      error: { code: "CONFLICT", message: "Já existe um registro com esses dados." },
    })
  }

  if (error.code === "23503") {
    return response.status(400).json({
      error: { code: "INVALID_REFERENCE", message: "Um prato informado não existe." },
    })
  }

  console.error("Erro não tratado na API:", error)
  response.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor." },
  })
}
