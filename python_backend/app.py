"""
FastAPI Microservice for SkyGuard AI Anomaly Engine
Run with:
    pip install fastapi uvicorn scikit-learn numpy scipy pydantic
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from skyguard_engine import MeteorologicalAnomalyEngine, TuningConfig, STATIONS

app = FastAPI(
    title="SkyGuard AI - Meteorological Anomaly Detection API",
    version="1.0.0",
    description="Ensemble physical & machine learning anomaly detection for Automated Weather Stations (AWS)"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = MeteorologicalAnomalyEngine()


class TelemetryInput(BaseModel):
    location_id: int = Field(default=0, ge=0, le=9, description="Station ID (0-9)")
    temperature: float = Field(..., description="Observed dry bulb temperature in °C")
    relative_humidity: float = Field(..., description="Observed relative humidity in %")
    surface_pressure: float = Field(..., description="Observed surface barometric pressure in hPa")
    previous_temperature: Optional[float] = Field(default=None, description="T-1 hr temperature")
    previous_humidity: Optional[float] = Field(default=None, description="T-1 hr relative humidity")
    previous_pressure: Optional[float] = Field(default=None, description="T-1 hr surface pressure")


class TuningPayload(BaseModel):
    sensitivity: float = Field(default=1.0, ge=0.2, le=3.0)
    temp_threshold: float = Field(default=8.0, ge=2.0, le=25.0)
    hum_threshold: float = Field(default=18.0, ge=5.0, le=40.0)
    press_threshold: float = Field(default=10.0, ge=3.0, le=30.0)


@app.get("/")
def root():
    return {
        "service": "SkyGuard AI Anomaly Engine",
        "status": "online",
        "stations_monitored": len(STATIONS),
        "docs_url": "/docs"
    }


@app.get("/api/stations")
def get_stations():
    return [
        {
            "location_id": s.location_id,
            "name": s.name,
            "short_name": s.short_name,
            "state": s.state,
            "coordinates": {"lat": s.latitude, "lng": s.longitude},
            "elevation_m": s.elevation_m,
            "climate_zone": s.climate_zone,
            "baseline": {
                "temperature": s.nominal_temp,
                "relative_humidity": s.nominal_humidity,
                "surface_pressure": s.nominal_pressure
            }
        }
        for s in STATIONS.values()
    ]


@app.post("/api/test-model")
def evaluate_model(payload: TelemetryInput):
    try:
        result = engine.evaluate_telemetry(
            temperature=payload.temperature,
            relative_humidity=payload.relative_humidity,
            surface_pressure=payload.surface_pressure,
            location_id=payload.location_id,
            previous_temperature=payload.previous_temperature,
            previous_humidity=payload.previous_humidity,
            previous_pressure=payload.previous_pressure
        )
        return {"status": "success", "evaluation": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/test-benchmark")
def run_benchmark():
    benchmark_results = engine.run_benchmark_suite()
    return {"status": "success", "benchmark": benchmark_results}


@app.post("/api/tune-thresholds")
def tune_thresholds(payload: TuningPayload):
    engine.tuning = TuningConfig(
        sensitivity=payload.sensitivity,
        temp_threshold=payload.temp_threshold,
        hum_threshold=payload.hum_threshold,
        press_threshold=payload.press_threshold
    )
    return {"status": "success", "config": engine.tuning}


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "engine": "active"}
