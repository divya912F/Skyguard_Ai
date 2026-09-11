import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { anomalyEngine } from "./server/anomalyEngine";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // -------------------------------------------------------------
  // SKYGUARD AI - FASTAPI COMPATIBLE REST API ENDPOINTS
  // -------------------------------------------------------------

  // Health check
  app.get(["/health", "/api/health"], (req, res) => {
    res.json({
      status: "healthy",
      service: "SkyGuard AI"
    });
  });

  // Stations directory with real live telemetry
  app.get(["/stations", "/api/stations"], async (req, res) => {
    const force = req.query.refresh === 'true';
    if (force) {
      await anomalyEngine.fetchRealLiveTelemetry(true);
    }
    const stations = anomalyEngine.getStations();
    res.json({ stations });
  });

  // Dedicated on-demand real-time live telemetry refresh endpoint
  app.post(["/api/stations/live-refresh", "/api/stations/refresh"], async (req, res) => {
    await anomalyEngine.fetchRealHourlyWeather(true);
    const stations = anomalyEngine.getStations();
    res.json({ status: "success", stations, sync_info: anomalyEngine.getHourlySyncInfo() });
  });

  // Hourly synchronization status from PMFBY WINDS
  app.get(["/api/weather/sync-info", "/api/sync-info"], (req, res) => {
    res.json(anomalyEngine.getHourlySyncInfo());
  });

  // Trigger hourly weather refresh on demand
  app.post(["/api/weather/sync-now", "/api/sync-now"], async (req, res) => {
    await anomalyEngine.fetchRealHourlyWeather(true);
    res.json({
      status: "success",
      sync_info: anomalyEngine.getHourlySyncInfo(),
      stations: anomalyEngine.getStations()
    });
  });

  // Weather data with period & month filtering
  app.get(["/weather", "/api/weather"], (req, res) => {
    const locationId = req.query.location_id !== undefined ? parseInt(String(req.query.location_id), 10) : undefined;
    const limit = req.query.limit !== undefined ? parseInt(String(req.query.limit), 10) : undefined;
    const period = req.query.period as '24h' | '7d' | '30d' | 'all' | undefined;
    const month = req.query.month !== undefined ? parseInt(String(req.query.month), 10) : undefined;
    const data = anomalyEngine.getWeather({ locationId, period, month, limit });
    res.json({ data });
  });

  // Diurnal 24-hour cycle analytics
  app.get("/api/diurnal", (req, res) => {
    const locationId = req.query.location_id !== undefined ? parseInt(String(req.query.location_id), 10) : 0;
    const diurnal = anomalyEngine.getDiurnalStats(locationId);
    res.json({ status: "success", location_id: locationId, diurnal });
  });

  // Seasonal & monthly analytics
  app.get("/api/seasonal", (req, res) => {
    const locationId = req.query.location_id !== undefined ? parseInt(String(req.query.location_id), 10) : undefined;
    const monthly = anomalyEngine.getMonthlyStats(locationId);
    res.json({ status: "success", monthly });
  });

  // Multi-station comparison
  app.get("/api/compare", (req, res) => {
    const idsParam = req.query.stations ? String(req.query.stations).split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)) : [0, 1, 8];
    const comparison = anomalyEngine.compareStations(idsParam);
    res.json({ status: "success", ...comparison });
  });

  // Threshold tuning config (GET & POST)
  app.get("/api/tune-thresholds", (req, res) => {
    const config = anomalyEngine.getTuningConfig();
    res.json({ status: "success", config });
  });

  app.post("/api/tune-thresholds", (req, res) => {
    const updated = anomalyEngine.setTuningConfig(req.body);
    res.json({ status: "success", config: updated });
  });

  // Alert triage update & remediation
  app.post("/api/alerts/status", (req, res) => {
    const alert_id = req.body.alert_id || req.body.id;
    const { status, notes } = req.body;
    if (!alert_id || !status) {
      return res.status(400).json({ error: "alert_id and status required" });
    }
    if (status === 'Resolved') {
      const remediated = anomalyEngine.remediateAlert(alert_id, notes);
      return res.json({ success: true, alert_id, status, notes, remediated });
    }
    const result = anomalyEngine.updateAlertTriage(alert_id, status, notes);
    res.json(result);
  });

  // Auto-clean & Impute Telemetry
  app.post("/api/alerts/clean", (req, res) => {
    const alert_id = req.body.alert_id || req.body.id;
    const { notes } = req.body;
    if (!alert_id) {
      return res.status(400).json({ error: "alert_id required" });
    }
    const result = anomalyEngine.remediateAlert(alert_id, notes);
    res.json(result);
  });

  // CSV Export
  app.get("/api/export-csv", (req, res) => {
    const locationId = req.query.location_id !== undefined ? parseInt(String(req.query.location_id), 10) : undefined;
    const csv = anomalyEngine.generateCsvExport(locationId);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="skyguard_station_${locationId ?? 'all'}_telemetry.csv"`);
    res.send(csv);
  });

  // Single detection
  app.get(["/detect", "/api/detect"], (req, res) => {
    const locationId = req.query.location_id !== undefined ? parseInt(String(req.query.location_id), 10) : 0;
    const result = anomalyEngine.detectSample(locationId);
    res.json(result);
  });

  // Alerts & health summary
  app.get(["/alerts", "/api/alerts"], (req, res) => {
    const locationId = req.query.location_id !== undefined ? parseInt(String(req.query.location_id), 10) : undefined;
    const alertsData = anomalyEngine.getAlerts(locationId);
    res.json(alertsData);
  });

  // Sensor health breakdown
  app.get(["/sensor-health", "/api/sensor-health"], (req, res) => {
    const breakdown = anomalyEngine.getStationHealthBreakdown();
    res.json({ status: "success", stations: breakdown });
  });

  // Standard demo simulation (exact match for Python /simulate-anomaly)
  app.post(["/simulate-anomaly", "/api/simulate-anomaly"], (req, res) => {
    const simResult = anomalyEngine.simulateStandardAnomaly();
    res.json(simResult);
  });

  // Custom interactive anomaly injection
  app.post("/api/inject-anomaly", (req, res) => {
    const alert = anomalyEngine.injectCustomAnomaly(req.body);
    res.json({ status: "success", alert });
  });

  // Model Testing & Inference Diagnostics endpoint (Evaluates arbitrary custom sensor readings without mutating telemetry)
  app.post("/api/test-model", (req, res) => {
    try {
      const evaluation = anomalyEngine.testModelOnInput(req.body);
      res.json({ status: "success", evaluation });
    } catch (err: any) {
      res.status(400).json({ status: "error", message: err.message || "Failed to evaluate model on input" });
    }
  });

  // Model Automated Benchmark Test Suite (Runs 8 meteorological stress test vectors)
  app.get("/api/test-benchmark", (req, res) => {
    const benchmark = anomalyEngine.runBenchmarkSuite();
    res.json({ status: "success", benchmark });
  });

  // Reset simulated anomalies
  app.post("/api/reset-data", (req, res) => {
    anomalyEngine.resetSimulations();
    res.json({ status: "success", message: "Simulations reset" });
  });

  // Custom Station Management Endpoints
  app.get("/api/custom-stations", (req, res) => {
    const stations = anomalyEngine.getCustomStations();
    res.json({ status: "success", stations });
  });

  app.post("/api/custom-stations", (req, res) => {
    try {
      const station = anomalyEngine.createCustomStation(req.body);
      res.json({ status: "success", station });
    } catch (err: any) {
      res.status(400).json({ status: "error", message: err.message || "Failed to create custom station" });
    }
  });

  app.get("/api/custom-stations/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const data = anomalyEngine.getCustomStation(id);
    if (!data) return res.status(404).json({ status: "error", message: "Custom station not found" });
    res.json({ status: "success", ...data });
  });

  app.post("/api/custom-stations/:id/readings", (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = anomalyEngine.addCustomStationReading(id, req.body);
      res.json({ status: "success", ...result });
    } catch (err: any) {
      res.status(400).json({ status: "error", message: err.message || "Failed to add custom station reading" });
    }
  });

  app.post("/api/custom-stations/:id/reset", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = anomalyEngine.resetCustomStation(id);
    res.json({ status: "success", ...result });
  });

  app.delete("/api/custom-stations/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const deleted = anomalyEngine.deleteCustomStation(id);
    res.json({ status: "success", deleted });
  });

  // Root endpoint: JSON if requested by programmatic client, HTML dashboard for browser
  app.get("/", (req, res, next) => {
    const acceptsHtml = req.accepts(["html", "json"]) === "html";
    if (!acceptsHtml) {
      return res.json({
        system: "SkyGuard AI",
        status: "Backend Running",
        message: "Weather Anomaly Detection API"
      });
    }
    next();
  });

  // -------------------------------------------------------------
  // VITE MIDDLEWARE / SPA STATIC SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SkyGuard AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start SkyGuard AI server:", err);
  process.exit(1);
});
