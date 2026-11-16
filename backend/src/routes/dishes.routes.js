import { Router } from "express"
import { dishDto, dishIdDto } from "../dtos/dish.dto.js"
import { requireAdmin, requireAuth } from "../middleware/auth.js"
import { pool } from "../db/pool.js"
import { HttpError } from "../utils/http-error.js"
import { asyncHandler } from "../utils/async-handler.js"

export const dishesRouter = Router()

function mapDish(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    fiber: Number(row.fiber),
    description: row.description,
    image: row.image,
    allergens: row.allergens,
    tags: row.tags,
  }
}

const dishColumns = `id::text, name, category, calories, protein, carbs, fat,
  fiber, description, image, allergens, tags`

dishesRouter.use(requireAuth)

dishesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const { rows } = await pool.query(
      `SELECT ${dishColumns} FROM dishes ORDER BY name`,
    )
    response.json({ data: rows.map(mapDish) })
  }),
)

dishesRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const id = dishIdDto.parse(request.params.id)
    const { rows } = await pool.query(
      `SELECT ${dishColumns} FROM dishes WHERE id = $1`,
      [id],
    )
    if (!rows[0]) throw new HttpError(404, "Prato não encontrado.", "DISH_NOT_FOUND")
    response.json({ data: mapDish(rows[0]) })
  }),
)

dishesRouter.post(
  "/",
  requireAdmin,
  asyncHandler(async (request, response) => {
    const dish = dishDto.parse(request.body)
    const { rows } = await pool.query(
      `INSERT INTO dishes
        (name, category, calories, protein, carbs, fat, fiber, description, image, allergens, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING ${dishColumns}`,
      [
        dish.name,
        dish.category,
        dish.calories,
        dish.protein,
        dish.carbs,
        dish.fat,
        dish.fiber,
        dish.description,
        dish.image,
        dish.allergens,
        dish.tags,
      ],
    )
    response.status(201).json({ data: mapDish(rows[0]) })
  }),
)

dishesRouter.put(
  "/:id",
  requireAdmin,
  asyncHandler(async (request, response) => {
    const id = dishIdDto.parse(request.params.id)
    const dish = dishDto.parse(request.body)
    const { rows } = await pool.query(
      `UPDATE dishes
       SET name = $2, category = $3, calories = $4, protein = $5, carbs = $6,
           fat = $7, fiber = $8, description = $9, image = $10,
           allergens = $11, tags = $12, updated_at = NOW()
       WHERE id = $1
       RETURNING ${dishColumns}`,
      [
        id,
        dish.name,
        dish.category,
        dish.calories,
        dish.protein,
        dish.carbs,
        dish.fat,
        dish.fiber,
        dish.description,
        dish.image,
        dish.allergens,
        dish.tags,
      ],
    )
    if (!rows[0]) throw new HttpError(404, "Prato não encontrado.", "DISH_NOT_FOUND")
    response.json({ data: mapDish(rows[0]) })
  }),
)

dishesRouter.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (request, response) => {
    const id = dishIdDto.parse(request.params.id)
    const { rowCount } = await pool.query("DELETE FROM dishes WHERE id = $1", [id])
    if (!rowCount) throw new HttpError(404, "Prato não encontrado.", "DISH_NOT_FOUND")
    response.status(204).end()
  }),
)
