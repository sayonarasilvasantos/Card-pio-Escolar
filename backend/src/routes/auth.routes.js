import { Router } from "express"
import { loginDto, registerDto } from "../dtos/auth.dto.js"
import { requireAuth } from "../middleware/auth.js"
import { loginUser, registerUser, getUserById } from "../services/auth.service.js"
import { asyncHandler } from "../utils/async-handler.js"

export const authRouter = Router()

authRouter.post(
  "/register",
  asyncHandler(async (request, response) => {
    const input = registerDto.parse(request.body)
    const session = await registerUser(input)
    response.status(201).json({ data: session })
  }),
)

authRouter.post(
  "/login",
  asyncHandler(async (request, response) => {
    const input = loginDto.parse(request.body)
    const session = await loginUser(input)
    response.json({ data: session })
  }),
)

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (request, response) => {
    response.json({ data: await getUserById(request.user.id) })
  }),
)
