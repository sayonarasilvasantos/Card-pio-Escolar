import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { pool } from "../db/pool.js"
import { HttpError } from "../utils/http-error.js"

function signToken(user) {
  return jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    },
  )
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

export async function registerUser(input) {
  const passwordHash = await bcrypt.hash(input.password, 12)
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id::text, name, email, role`,
    [input.name, input.email, passwordHash, input.role],
  )
  const user = toPublicUser(rows[0])
  return { token: signToken(user), user }
}

export async function loginUser(input) {
  const { rows } = await pool.query(
    `SELECT id::text, name, email, role, password_hash
     FROM users
     WHERE LOWER(email) = $1`,
    [input.email],
  )
  const user = rows[0]
  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    throw new HttpError(401, "E-mail ou senha incorretos.", "INVALID_CREDENTIALS")
  }

  const publicUser = toPublicUser(user)
  return { token: signToken(publicUser), user: publicUser }
}

export async function getUserById(id) {
  const { rows } = await pool.query(
    `SELECT id::text, name, email, role
     FROM users
     WHERE id = $1`,
    [id],
  )
  if (!rows[0]) throw new HttpError(404, "Usuário não encontrado.", "USER_NOT_FOUND")
  return toPublicUser(rows[0])
}
