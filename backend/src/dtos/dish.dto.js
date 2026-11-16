import { z } from "zod"

const nonNegativeNumber = z.coerce.number().finite().min(0).max(10000)
const imageUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => /^https?:\/\//i.test(value), "A imagem deve usar HTTP ou HTTPS.")

export const dishDto = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(["principal", "acompanhamento", "sobremesa", "sopa"]),
  calories: nonNegativeNumber,
  protein: nonNegativeNumber,
  carbs: nonNegativeNumber,
  fat: nonNegativeNumber,
  fiber: nonNegativeNumber,
  description: z.string().trim().min(1).max(1000),
  image: z.union([imageUrl, z.literal("")]).default(""),
  allergens: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  tags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
})

export const dishIdDto = z.string().uuid()
