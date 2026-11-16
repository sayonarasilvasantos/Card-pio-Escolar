import { z } from "zod"

export const isoDateDto = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  }, "Informe uma data válida no formato AAAA-MM-DD.")

export const weekQueryDto = z.object({
  weekStart: isoDateDto.refine((value) => {
    return new Date(`${value}T00:00:00.000Z`).getUTCDay() === 1
  }, "A semana deve começar em uma segunda-feira."),
})

export const menuDateDto = isoDateDto

export const updateMenuDto = z.object({
  dishIds: z.array(z.string().uuid()).max(50).refine(
    (ids) => new Set(ids).size === ids.length,
    "O mesmo prato não pode aparecer mais de uma vez.",
  ),
})
