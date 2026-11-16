import "dotenv/config"
import bcrypt from "bcryptjs"
import { createAdminDto } from "../dtos/auth.dto.js"
import { pool } from "../db/pool.js"

async function createAdmin() {
  const input = createAdminDto.parse({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })
  const passwordHash = await bcrypt.hash(input.password, 12)
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'administrador')`,
    [input.name, input.email, passwordHash],
  )
  console.log(`Administrador criado: ${input.email}`)
}

createAdmin()
  .catch((error) => {
    console.error("Não foi possível criar o administrador:", error)
    process.exitCode = 1
  })
  .finally(() => pool.end())
