import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

// All database settings come from .env so credentials are not hard-coded.
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
