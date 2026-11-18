
import { afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "./app";
import { pool } from "./db";

const savedDesignIds: number[] = [];

afterAll(async () => {
  try {
    if (savedDesignIds.length > 0) {
      await pool.query(
        "DELETE FROM room_designs WHERE id = ANY($1::integer[])",
        [savedDesignIds]
      );
    }
  } finally {
    await pool.end();
  }
});

describe("Furniture API", () => {
  it("returns the furniture catalogue", async () => {
    const response = await request(app).get("/api/furniture");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(4);
    expect(response.body[0].name).toBe("Nordic Sofa");
  });

  it("saves a room design", async () => {
    const design = {
      furniture: [
        {
          id: 1,
          name: "Nordic Sofa",
          category: "Sofa",
          price: 499,
          emoji: "🛋️",
        },
      ],
      sofaPosition: [0, 0, 0],
      sofaRotation: 0,
      coffeeTablePosition: [0, 0, 2],
      floorLampPosition: [-2, 0, 2],
      bookshelfPosition: [2, 0, 2],
    };

    const response = await request(app)
      .post("/api/design")
      .send(design);

    if (typeof response.body.id === "number") {
      savedDesignIds.push(response.body.id);
    }
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });

  it("loads the latest saved room design", async () => {
    const response = await request(app).get("/api/design");

    expect(response.status).toBe(200);
    expect(response.body.furniture).toBeDefined();
    expect(response.body.furniture[0].name).toBe("Nordic Sofa");
  });

  it("rejects an invalid furniture item", async () => {
    const response = await request(app).post("/api/design").send({
      furniture: [{ id: "invalid", name: "Nordic Sofa" }],
      sofaPosition: [0, 0, 0],
      sofaRotation: 0,
      coffeeTablePosition: [0, 0, 2],
      floorLampPosition: [-2, 0, 2],
      bookshelfPosition: [2, 0, 2],
    });

    expect(response.status).toBe(400);
  });

  it("persists a furniture selection after an item is removed", async () => {
    const design = {
      furniture: [
        {
          id: 1,
          name: "Nordic Sofa",
          category: "Sofa",
          price: 499,
          emoji: "🛋️",
        },
        {
          id: 2,
          name: "Coffee Table",
          category: "Table",
          price: 129,
          emoji: "🪑",
        },
      ],
      sofaPosition: [0, 0, 0],
      sofaRotation: 0,
      coffeeTablePosition: [0, 0, 2],
      floorLampPosition: [-2, 0, 2],
      bookshelfPosition: [2, 0, 2],
    };

    const selectedResponse = await request(app)
      .post("/api/design")
      .send(design);
    if (typeof selectedResponse.body.id === "number") {
      savedDesignIds.push(selectedResponse.body.id);
    }
    expect(selectedResponse.status).toBe(201);

    const removedResponse = await request(app)
      .post("/api/design")
      .send({
        ...design,
        furniture: design.furniture.filter(
          (item) => item.name !== "Nordic Sofa"
        ),
      });
    if (typeof removedResponse.body.id === "number") {
      savedDesignIds.push(removedResponse.body.id);
    }
    expect(removedResponse.status).toBe(201);

    const loadedResponse = await request(app).get("/api/design");

    expect(loadedResponse.status).toBe(200);
    expect(loadedResponse.body.furniture.map(
      (item: { name: string }) => item.name
    )).toEqual(["Coffee Table"]);
  });
});
