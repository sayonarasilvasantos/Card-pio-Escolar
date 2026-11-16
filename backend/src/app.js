import express from "express"
import helmet from "helmet"
import { pool } from "./db/pool.js"
import { authRouter } from "./routes/auth.routes.js"
import { dishesRouter } from "./routes/dishes.routes.js"
import { menuRouter } from "./routes/menu.routes.js"
import { errorHandler, notFound } from "./middleware/errors.js"
import { asyncHandler } from "./utils/async-handler.js"

export const app = express()

app.disable("x-powered-by")
app.use(helmet())
app.use(express.json({ limit: "1mb" }))

app.get(
  "/api/health",
  asyncHandler(async (request, response) => {
    await pool.query("SELECT 1")
    response.json({ data: { status: "ok", database: "connected" } })
  }),
)

app.use("/api/auth", authRouter)
app.use("/api/dishes", dishesRouter)
app.use("/api/menu", menuRouter)
app.use("/api", notFound)
app.use(errorHandler)
