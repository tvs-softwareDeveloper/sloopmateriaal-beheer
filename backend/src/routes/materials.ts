import { db } from "../db";
import express from "express";
import { v4 as uuid } from "uuid";
import { Material } from "../types/material";

const router = express.Router();

function mapMaterial(row: any, req?: express.Request): Material {
  const host = req
    ? (
        process.env.PUBLIC_HOST || `${req.protocol}://${req.get("host")}`
      ).replace(/\/$/, "")
    : process.env.PUBLIC_HOST || "http://localhost:3000";

  const images: string[] = (() => {
    try {
      if (!row.images) return [];
      let arr: string[];
      if (typeof row.images === "string") {
        const s = row.images.trim();
        if (s === "" || s.toLowerCase() === "null") return [];
        arr = JSON.parse(s);
      } else if (Array.isArray(row.images)) {
        arr = row.images;
      } else {
        return [];
      }

      // prepend host and /upoads/
      return arr.map((f) => `${host}/uploads/${f}`);
    } catch (err) {
      console.warn(`Failed to parse images for material id ${row.id}:`, err);
      return [];
    }
  })();

  return {
    id: row.id,
    name: row.name,
    material_type: row.material_type,
    quantity: row.quantity,
    unit: row.unit,
    status: row.status,
    location: row.location,
    condition: row.condition,
    notes: row.notes,
    qr_code: row.qr_code,
    images,
    price: row.price !== null ? Number(row.price) : undefined,
    project_name: row.project_name,
    created_date: row.created_date ? row.created_date.toISOString() : undefined,
  };
}

// GET all materials
router.get("/", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM materials");
  const mapped = (rows as any[]).map((row) => mapMaterial(row, req));
  res.json(mapped);
});

// GET single material by id
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const [rows] = await db.query("SELECT * FROM materials WHERE id = ?", [id]);
  const row = (rows as any[])[0];
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(mapMaterial(row, req));
});

router.post("/", async (req, res) => {
  const id = uuid();

  if (!req.body.material_type) {
    return res.status(400).json({ error: "material_type is required" });
  }

  const material: Material = {
    ...req.body,
    id,
    images: Array.isArray(req.body.images)
      ? req.body.images.map((url: string) => url.split("/").pop())
      : [],
  };

  await db.query("INSERT INTO materials SET ?", [
    {
      ...material,
      images: JSON.stringify(material.images),
    },
  ]);

  res.status(201).json(material);
});

router.put("/:id", async (req, res) => {
  if (req.body.material_type === undefined) {
    return res.status(400).json({ error: "material_type cannot be removed" });
  }

  const id = req.params.id;
  const updates = req.body;

  await db.query("UPDATE materials SET ? WHERE id = ?", [
    {
      ...updates,
      images: updates.images ? JSON.stringify(updates.images) : undefined,
    },
    id,
  ]);

  const [rows] = await db.query("SELECT * FROM materials WHERE id = ?", [id]);
  res.json(mapMaterial((rows as any)[0]));
});

// DELETE material
router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  await db.query("DELETE FROM materials WHERE id = ?", [id]);
  res.sendStatus(204);
});

export default router;
