import "dotenv/config"
import { app } from "./app.js"
import { pool } from "./db/pool.js"

const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || "127.0.0.1"
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres.")
}

const server = app.listen(port, host, () => {
  console.log(`API NutriEscola disponível em http://${host}:${port}`)
})

function shutdown() {
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
