import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { extractNutrition } from "./geminiService";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // API endpoint for Gemini nutrition extraction
  app.post("/api/extract-nutrition", async (req, res) => {
    try {
      const { text, imageB64, audioB64, history } = req.body;
      const items = await extractNutrition(text, imageB64, audioB64, history);
      res.json({ items });
    } catch (error: any) {
      console.error("[Server] Gemini extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to process nutrition request" });
    }
  });

  // Fitbit token exchange proxy
  app.post("/api/fitbit/token", async (req, res) => {
    try {
      const { code } = req.body;
      const fitbitConfig = {
        clientId: '23TVTH',
        clientSecret: '89a45c8661a5cb1dcaf53157a83b185f',
        redirectUri: 'https://calorietracker-457380672728.us-west1.run.app/',
        tokenUrl: 'https://api.fitbit.com/oauth2/token'
      };

      const params = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: fitbitConfig.redirectUri,
        client_id: fitbitConfig.clientId,
      });

      const fitbitRes = await fetch(fitbitConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${fitbitConfig.clientId}:${fitbitConfig.clientSecret}`).toString('base64')}`,
        },
        body: params.toString(),
      });

      const data = await fitbitRes.json();
      res.status(fitbitRes.status).json(data);
    } catch (error: any) {
      console.error("[Server] Fitbit token proxy error:", error);
      res.status(500).json({ error: error.message || "Failed to exchange Fitbit code" });
    }
  });

  // Fitbit calories proxy
  app.get("/api/fitbit/calories", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const date = req.query.date as string;
      if (!authHeader) {
        return res.status(401).json({ error: "Missing authorization header" });
      }

      const fitbitRes = await fetch(`https://api.fitbit.com/1/user/-/activities/date/${date}.json`, {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
        },
      });

      if (!fitbitRes.ok) {
        const errorData = await fitbitRes.json();
        return res.status(fitbitRes.status).json({ error: errorData.errors?.[0]?.message || 'Fitbit fetch failed' });
      }

      const data = await fitbitRes.json();
      res.json({ caloriesOut: data.summary?.caloriesOut || 0 });
    } catch (error: any) {
      console.error("[Server] Fitbit calories proxy error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch Fitbit calories" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
