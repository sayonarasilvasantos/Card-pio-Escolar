import { z } from "zod"

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase())

export const registerDto = z.object({
  name: z.string().trim().min(3).max(120),
  email,
  password: z.string().min(8).max(128),
  role: z.enum(["aluno", "professor", "colaborador"]).default("aluno"),
})

export const loginDto = z.object({
  email,
  password: z.string().min(8).max(128),
})

export const createAdminDto = z.object({
  name: z.string().trim().min(3).max(120),
  email,
  password: z.string().min(12).max(128),
})
