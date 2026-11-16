import "dotenv/config"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { pool } from "./pool.js"
import { demoDishes, demoMenu } from "./demo-data.js"

function formatDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function currentWeekDates() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return Array.from({ length: 5 }, (_, index) => {
    const weekday = new Date(date)
    weekday.setDate(date.getDate() + index)
    return formatDate(weekday)
  })
}

async function setup() {
  const schema = await readFile(
    fileURLToPath(new URL("./schema.sql", import.meta.url)),
    "utf8",
  )
  await pool.query(schema)

  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    for (const dish of demoDishes) {
      await client.query(
        `INSERT INTO dishes
          (name, category, calories, protein, carbs, fat, fiber, description, image, allergens, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (name) DO NOTHING`,
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
    }

    const dishRows = await client.query("SELECT id, name FROM dishes")
    const dishIds = new Map(dishRows.rows.map((row) => [row.name, row.id]))
    const dates = currentWeekDates()

    for (const [index, names] of demoMenu.entries()) {
      const { rows } = await client.query(
        `INSERT INTO menu_days (menu_date)
         VALUES ($1)
         ON CONFLICT (menu_date) DO NOTHING
         RETURNING id`,
        [dates[index]],
      )
      if (rows.length === 0) continue

      for (const [position, name] of names.entries()) {
        await client.query(
          `INSERT INTO menu_day_dishes (menu_day_id, dish_id, position)
           VALUES ($1, $2, $3)`,
          [rows[0].id, dishIds.get(name), position],
        )
      }
    }
    await client.query("COMMIT")
    console.log("Banco preparado; pratos demonstrativos adicionados.")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

setup().catch((error) => {
  console.error("Não foi possível preparar o banco:", error)
  process.exitCode = 1
}).finally(() => pool.end())
