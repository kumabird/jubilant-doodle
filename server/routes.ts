import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.customErasers.list.path, async (req, res) => {
    const erasers = await storage.getCustomErasers();
    res.json(erasers);
  });

  app.post(api.customErasers.create.path, async (req, res) => {
    try {
      const input = api.customErasers.create.input.parse(req.body);
      const eraser = await storage.createCustomEraser(input);
      res.status(201).json(eraser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.customErasers.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    await storage.deleteCustomEraser(id);
    res.status(204).end();
  });

  return httpServer;
}
