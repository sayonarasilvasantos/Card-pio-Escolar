import "dotenv/config"
import pg from "pg"

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não foi definida. Configure o arquivo backend/.env.")
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on("error", (error) => {
  console.error("Erro inesperado na conexão com PostgreSQL:", error)
})
