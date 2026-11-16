import { Router } from "express"
import { menuDateDto, updateMenuDto, weekQueryDto } from "../dtos/menu.dto.js"
import { requireAdmin, requireAuth } from "../middleware/auth.js"
import { pool } from "../db/pool.js"
import { HttpError } from "../utils/http-error.js"
import { asyncHandler } from "../utils/async-handler.js"

export const menuRouter = Router()

function addDayLabel(day) {
  const date = new Date(`${day.date}T00:00:00.000Z`)
  return {
    ...day,
    day: new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      timeZone: "UTC",
    }).format(date),
    dateLabel: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    }).format(date),
  }
}

menuRouter.use(requireAuth)

menuRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const { weekStart } = weekQueryDto.parse(request.query)
    const { rows } = await pool.query(
      `WITH week_days AS (
         SELECT generate_series($1::date, $1::date + 4, INTERVAL '1 day')::date AS menu_date
       )
       SELECT TO_CHAR(week_days.menu_date, 'YYYY-MM-DD') AS date,
              dishes.id::text AS dish_id
       FROM week_days
       LEFT JOIN menu_days ON menu_days.menu_date = week_days.menu_date
       LEFT JOIN menu_day_dishes
         ON menu_day_dishes.menu_day_id = menu_days.id
       LEFT JOIN dishes ON dishes.id = menu_day_dishes.dish_id
       ORDER BY week_days.menu_date, menu_day_dishes.position`,
      [weekStart],
    )

    const byDate = new Map()
    for (const row of rows) {
      if (!byDate.has(row.date)) byDate.set(row.date, { date: row.date, ids: [] })
      if (row.dish_id) byDate.get(row.date).ids.push(row.dish_id)
    }

    response.json({
      data: { days: [...byDate.values()].map(addDayLabel) },
    })
  }),
)

menuRouter.put(
  "/:date",
  requireAdmin,
  asyncHandler(async (request, response) => {
    const date = menuDateDto.parse(request.params.date)
    const { dishIds } = updateMenuDto.parse(request.body)
    const client = await pool.connect()

    try {
      await client.query("BEGIN")
      if (dishIds.length) {
        const found = await client.query(
          "SELECT id FROM dishes WHERE id = ANY($1::uuid[])",
          [dishIds],
        )
        if (found.rowCount !== dishIds.length) {
          throw new HttpError(400, "Um ou mais pratos não existem.", "INVALID_DISH")
        }
      }

      const { rows } = await client.query(
        `INSERT INTO menu_days (menu_date)
         VALUES ($1)
         ON CONFLICT (menu_date) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [date],
      )
      const menuDayId = rows[0].id
      await client.query("DELETE FROM menu_day_dishes WHERE menu_day_id = $1", [menuDayId])
      for (const [position, dishId] of dishIds.entries()) {
        await client.query(
          `INSERT INTO menu_day_dishes (menu_day_id, dish_id, position)
           VALUES ($1, $2, $3)`,
          [menuDayId, dishId, position],
        )
      }
      await client.query("COMMIT")
      response.json({ data: { date, ids: dishIds } })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }),
)
