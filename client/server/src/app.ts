
import express from "express";
import cors from "cors";
import { furniture } from "./data/furniture";
import { pool } from "./db";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/furniture", (req, res) => {
  res.json(furniture);
});

type RoomDesign = {
  furniture: Furniture[];
  sofaPosition: [number, number, number];
  sofaRotation: number;
  coffeeTablePosition: [number, number, number];
  floorLampPosition: [number, number, number];
  bookshelfPosition: [number, number, number];
};

type Furniture = {
  id: number;
  name: string;
  category: string;
  price: number;
  emoji: string;
};

function isPosition(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every(
      (coordinate) =>
        typeof coordinate === "number" && Number.isFinite(coordinate)
    )
  );
}

function isFurniture(value: unknown): value is Furniture {
  // Validate the persisted catalogue shape at the API boundary.
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "number" &&
    Number.isFinite(item.id) &&
    typeof item.name === "string" &&
    typeof item.category === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    typeof item.emoji === "string"
  );
}

function isRoomDesign(value: unknown): value is RoomDesign {
  if (typeof value !== "object" || value === null) return false;

  const design = value as Record<string, unknown>;
  return (
    Array.isArray(design.furniture) &&
    design.furniture.every(isFurniture) &&
    isPosition(design.sofaPosition) &&
    typeof design.sofaRotation === "number" &&
    Number.isFinite(design.sofaRotation) &&
    isPosition(design.coffeeTablePosition) &&
    isPosition(design.floorLampPosition) &&
    isPosition(design.bookshelfPosition)
  );
}

app.post("/api/design", async (req, res) => {
  const design: unknown = req.body;
  if (!isRoomDesign(design)) {
    return res.status(400).json({ message: "Invalid room design" });
  }

  try {
    const { rows } = await pool.query(
      "INSERT INTO room_designs (design_data) VALUES ($1) RETURNING id",
      [design]
    );

    res.status(201).json({
      message: "Room design saved successfully!",
      id: rows[0].id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save design" });
  }
});

app.get("/api/design", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT design_data FROM room_designs ORDER BY id DESC LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "No saved design found" });
    }

    res.json(rows[0].design_data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load design" });
  }
});

const PORT = 5000;

async function startServer() {
  try {
    // Fail startup instead of listening with a missing or incompatible schema.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS room_designs (
        id SERIAL PRIMARY KEY,
        design_data JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const result = await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected successfully!");
    console.log("Database time:", result.rows[0].now);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "Failed to initialize PostgreSQL:",
      error instanceof Error ? error.message : error
    );
    process.exitCode = 1;
  }
}

// Vitest supplies the app directly, so it must not start the HTTP listener.
if (process.env.NODE_ENV !== "test") {
  void startServer();
}

export { app };
