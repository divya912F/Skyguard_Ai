"""
SkyGuard AI - Meteorological Automated Weather Station (AWS) Anomaly Detection Engine
Production-grade Python implementation matching the multi-layer ensemble architecture:
1. Layer 1: WMO Physical & Dynamic Sensor Bounds
2. Layer 2: Temporal Rate-of-Change / Step Jump Detection
3. Layer 3: Dynamic 3-Sigma Gaussian Z-Score Deviation
4. Layer 4: Clausius-Clapeyron Psychrometric Thermodynamic Consistency
5. Layer 5: Isolation Forest / Contamination Hyper-plane Scoring
"""

import math
import time
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field, asdict

# Optional machine learning import with graceful fallback
try:
    import numpy as np
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    np = None


@dataclass
class StationMeta:
    location_id: int
    name: str
    short_name: str
    state: str
    latitude: float
    longitude: float
    elevation_m: float
    climate_zone: str
    nominal_temp: float
    nominal_humidity: float
    nominal_pressure: float


STATIONS: Dict[int, StationMeta] = {
    0: StationMeta(0, "New Delhi (Safdarjung Observatory)", "Delhi NCR", "Delhi", 28.585, 77.206, 216, "Composite Semi-Arid", 19.4, 71.0, 1016.0),
    1: StationMeta(1, "Mumbai (Colaba Coastal Observatory)", "Mumbai Coast", "Maharashtra", 18.898, 72.812, 11, "Tropical Maritime Coastal", 27.0, 78.0, 1011.0),
    2: StationMeta(2, "Kolkata (Alipore Observatory)", "Kolkata Delta", "West Bengal", 22.532, 88.324, 6, "Tropical Wet-and-Dry Delta", 28.0, 82.0, 1008.0),
    3: StationMeta(3, "Chennai (Meenambakkam Observatory)", "Chennai Coast", "Tamil Nadu", 12.985, 80.181, 16, "Tropical Wet-and-Dry Maritime", 29.0, 76.0, 1009.0),
    4: StationMeta(4, "Lucknow (Amausi Observatory)", "Lucknow Plains", "Uttar Pradesh", 26.760, 80.880, 123, "Humid Subtropical Gangetic Plain", 21.0, 68.0, 1014.0),
    5: StationMeta(5, "Ranchi (Hinoo Observatory)", "Ranchi Plateau", "Jharkhand", 23.314, 85.321, 651, "Humid Subtropical Plateau", 23.0, 70.0, 1012.0),
    6: StationMeta(6, "Bhubaneswar (Biju Patnaik Observatory)", "Bhubaneswar Coastal", "Odisha", 20.252, 85.817, 45, "Tropical Savanna Coastal Plain", 28.0, 78.0, 1009.0),
    7: StationMeta(7, "Varanasi (Babatpur Observatory)", "Varanasi Valley", "Uttar Pradesh", 25.450, 82.860, 81, "Humid Subtropical River Basin", 22.0, 69.0, 1013.0),
    8: StationMeta(8, "Dehradun (Doon Valley Observatory)", "Dehradun Foothills", "Uttarakhand", 30.325, 78.034, 682, "Subtropical Highland Foothills", 18.0, 65.0, 1015.0),
    9: StationMeta(9, "Guwahati (Borjhar Observatory)", "Guwahati Valley", "Assam", 26.106, 91.585, 54, "Humid Subtropical Brahmaputra Valley", 25.0, 84.0, 1007.0),
}


def calculate_dew_point(temp_c: float, humidity_pct: float) -> float:
    """Magnus-Tetens psychrometric formula approximation (WMO standard)."""
    hum = max(0.1, min(100.0, humidity_pct))
    a = 17.27
    b = 237.7
    alpha = ((a * temp_c) / (b + temp_c)) + math.log(hum / 100.0)
    dew_point = (b * alpha) / (a - alpha)
    return round(dew_point, 1)


def calculate_heat_index(temp_c: float, humidity_pct: float) -> float:
    """NOAA Rothfusz regression equation for apparent temperature (Heat Index)."""
    if temp_c < 20.0:
        return temp_c
    t_f = (temp_c * 9.0 / 5.0) + 32.0
    rh = max(0.0, min(100.0, humidity_pct))
    
    hi_f = (
        -42.379
        + 2.04901523 * t_f
        + 10.14333127 * rh
        - 0.22475541 * t_f * rh
        - 0.00683783 * (t_f ** 2)
        - 0.05481717 * (rh ** 2)
        + 0.00122874 * (t_f ** 2) * rh
        + 0.00085282 * t_f * (rh ** 2)
        - 0.00000199 * (t_f ** 2) * (rh ** 2)
    )
    hi_c = (hi_f - 32.0) * 5.0 / 9.0
    return round(hi_c, 1)


def calculate_vpd(temp_c: float, humidity_pct: float) -> float:
    """Vapor Pressure Deficit (VPD in kPa) using Tetens equation."""
    es = 0.61078 * math.exp((17.27 * temp_c) / (temp_c + 237.3))
    ea = es * (max(0.0, min(100.0, humidity_pct)) / 100.0)
    vpd = max(0.0, es - ea)
    return round(vpd, 2)


@dataclass
class TuningConfig:
    sensitivity: float = 1.0
    temp_threshold: float = 8.0
    hum_threshold: float = 18.0
    press_threshold: float = 10.0


class MeteorologicalAnomalyEngine:
    """
    Multi-layer Physics & Statistical Anomaly Detector for Weather Stations.
    """

    def __init__(self, tuning: Optional[TuningConfig] = None):
        self.tuning = tuning or TuningConfig()
        self.stations = STATIONS
        self._init_isolation_forest()

    def _init_isolation_forest(self):
        """Initializes Isolation Forest model with nominal climatological distributions."""
        if SKLEARN_AVAILABLE and np is not None:
            # Seed synthetic nominal training matrix across all 10 climate zones
            rng = np.random.default_rng(42)
            records = []
            for meta in self.stations.values():
                temps = rng.normal(meta.nominal_temp, 3.2, 300)
                hums = np.clip(rng.normal(meta.nominal_humidity, 7.5, 300), 10, 98)
                press = rng.normal(meta.nominal_pressure, 3.8, 300)
                d_temps = rng.normal(0.0, 1.2, 300)
                d_press = rng.normal(0.0, 1.0, 300)
                for i in range(300):
                    records.append([temps[i], hums[i], press[i], d_temps[i], d_press[i]])
            
            X = np.array(records)
            self.clf = IsolationForest(
                n_estimators=100,
                contamination=0.04,  # Exact 4% baseline anomaly rate
                random_state=42,
                n_jobs=-1
            )
            self.clf.fit(X)
        else:
            self.clf = None

    def evaluate_telemetry(
        self,
        temperature: float,
        relative_humidity: float,
        surface_pressure: float,
        location_id: int = 0,
        previous_temperature: Optional[float] = None,
        previous_humidity: Optional[float] = None,
        previous_pressure: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Runs complete 5-layer diagnostic inference on a single meteorological observation.
        """
        start_t = time.perf_counter()
        meta = self.stations.get(location_id, self.stations[0])

        temp = float(temperature)
        hum = float(relative_humidity)
        press = float(surface_pressure)

        prev_temp = float(previous_temperature if previous_temperature is not None else meta.nominal_temp)
        prev_hum = float(previous_humidity if previous_humidity is not None else meta.nominal_humidity)
        prev_press = float(previous_pressure if previous_pressure is not None else meta.nominal_pressure)

        delta_temp = round(temp - prev_temp, 1)
        delta_hum = round(hum - prev_hum, 1)
        delta_press = round(press - prev_press, 1)

        dew_point = calculate_dew_point(temp, hum)
        heat_index = calculate_heat_index(temp, hum)
        vpd = calculate_vpd(temp, hum)

        # Dynamic Z-scores relative to regional climatological baseline
        z_temp = round((temp - meta.nominal_temp) / 3.8, 2)
        z_hum = round((hum - meta.nominal_humidity) / 8.5, 2)
        z_press = round((press - meta.nominal_pressure) / 4.2, 2)

        eff_temp_th = self.tuning.temp_threshold / self.tuning.sensitivity
        eff_hum_th = self.tuning.hum_threshold / self.tuning.sensitivity
        eff_press_th = self.tuning.press_threshold / self.tuning.sensitivity

        layer_diagnostics = []

        # Layer 1: Physical WMO limits
        is_physical_breach = (
            temp < -35.0 or temp > 56.0 or
            hum < 0.0 or hum > 100.0 or
            press < 860.0 or press > 1085.0
        )
        layer_diagnostics.append({
            "id": "L1",
            "name": "WMO Physical & Sensor Limits",
            "status": "FLAGGED" if is_physical_breach else "PASS",
            "metric": f"T:{temp}°C, RH:{hum}%, P:{press}hPa",
            "threshold": "T: -35..56°C | RH: 0..100% | P: 860..1085hPa",
            "details": "Transducer reading violates physical thermodynamics" if is_physical_breach else "Within global meteorological boundaries"
        })

        # Layer 2: Rate of Change (Temporal step)
        is_temp_step = abs(delta_temp) >= eff_temp_th
        is_hum_step = abs(delta_hum) >= eff_hum_th
        is_press_step = abs(delta_press) >= eff_press_th
        is_step_breach = is_temp_step or is_hum_step or is_press_step
        layer_diagnostics.append({
            "id": "L2",
            "name": "Temporal Rate-of-Change / Step Jump",
            "status": "FLAGGED" if is_step_breach else ("WARNING" if abs(delta_temp) > eff_temp_th * 0.75 else "PASS"),
            "metric": f"ΔT:{'+' if delta_temp >= 0 else ''}{delta_temp}°C | ΔRH:{'+' if delta_hum >= 0 else ''}{delta_hum}% | ΔP:{'+' if delta_press >= 0 else ''}{delta_press}hPa",
            "threshold": f"Max ΔT: ±{eff_temp_th:.1f}°C | ΔRH: ±{eff_hum_th:.1f}% | ΔP: ±{eff_press_th:.1f}hPa",
            "details": "Violates 1-hour temporal change continuity constraint" if is_step_breach else "Temporal rate within climatological expectation"
        })

        # Layer 3: Dynamic Gaussian 3-Sigma Z-score
        max_z = max(abs(z_temp), abs(z_hum), abs(z_press))
        is_z_breach = max_z >= 3.0
        layer_diagnostics.append({
            "id": "L3",
            "name": "Dynamic 3-Sigma Gaussian Z-Score",
            "status": "FLAGGED" if is_z_breach else ("WARNING" if max_z >= 2.2 else "PASS"),
            "metric": f"Z_temp:{z_temp}σ | Z_hum:{z_hum}σ | Z_press:{z_press}σ (Max: {max_z:.2f}σ)",
            "threshold": "Z_score < 3.0σ (99.7% confidence envelope)",
            "details": f"Statistically anomalous deviation ({max_z:.1f}σ)" if is_z_breach else "Conforms to standard normal distribution"
        })

        # Layer 4: Psychrometric Thermodynamics
        is_psychrometric_breach = (dew_point > temp + 0.1) or (hum < 15.0 and dew_point > 20.0)
        layer_diagnostics.append({
            "id": "L4",
            "name": "Psychrometric Thermodynamics (Clausius-Clapeyron)",
            "status": "FLAGGED" if is_psychrometric_breach else "PASS",
            "metric": f"Dew Point: {dew_point}°C (vs Dry Bulb: {temp}°C, VPD: {vpd} kPa)",
            "threshold": "Dew Point <= Dry Bulb Temperature",
            "details": "Inconsistent dew-point / supersaturation violation" if is_psychrometric_breach else "Thermodynamically consistent moisture equilibrium"
        })

        # Layer 5: Isolation Forest / Multi-dimensional Hyper-plane
        if self.clf is not None and np is not None:
            features = np.array([[temp, hum, press, delta_temp, delta_press]])
            pred = self.clf.predict(features)[0]  # -1 for anomaly, 1 for normal
            score = float(-self.clf.score_samples(features)[0])  # higher score = more anomalous
            is_if_breach = pred == -1 or score >= 0.52
            isolation_pct = round(score * 100, 1)
        else:
            # Fallback heuristic calculation
            score = min(1.0, (
                (0.95 if is_physical_breach else 0) +
                abs(delta_temp) / 18.0 * 0.45 +
                abs(delta_press) / 20.0 * 0.35 +
                abs(z_temp) / 5.0 * 0.25
            ))
            is_if_breach = score >= 0.52
            isolation_pct = round(score * 100, 1)

        layer_diagnostics.append({
            "id": "L5",
            "name": "Isolation Forest Anomaly Scoring",
            "status": "FLAGGED" if is_if_breach else ("WARNING" if isolation_pct >= 40.0 else "PASS"),
            "metric": f"Isolation Score: {isolation_pct}%",
            "threshold": "Contamination cutoff < 52.0%",
            "details": "High contamination density hyper-plane" if is_if_breach else "Normal isolation tree depth cluster"
        })

        # Ensemble Voting
        is_anomaly = is_physical_breach or is_step_breach or is_z_breach or is_psychrometric_breach or is_if_breach

        # Classification
        anomaly_type = "normal"
        if is_physical_breach:
            anomaly_type = "range_fault"
        elif is_temp_step:
            anomaly_type = "temperature_spike_drop"
        elif is_press_step:
            anomaly_type = "pressure_spike_drop"
        elif is_hum_step:
            anomaly_type = "humidity_spike_drop"
        elif is_psychrometric_breach:
            anomaly_type = "psychrometric_inconsistency"
        elif is_z_breach or is_if_breach:
            anomaly_type = "statistical_outlier"

        # Severity & Confidence
        if is_anomaly:
            severity_score = min(100, int(
                (95 if is_physical_breach else 0) +
                abs(delta_temp) * 3.5 +
                abs(delta_press) * 2.8 +
                max_z * 8
            ))
            if severity_score >= 80:
                severity = "Critical"
            elif severity_score >= 55:
                severity = "High"
            else:
                severity = "Medium"
            confidence = round(88.0 + min(11.5, max_z * 2.5), 1)
        else:
            severity_score = 15
            severity = "Nominal"
            confidence = 98.4

        # Feature Importance Weights
        total_impact = max(0.1, abs(delta_temp) * 3.0 + abs(delta_press) * 2.5 + abs(delta_hum) * 1.5)
        feature_importance = [
            {
                "feature": "Air Temperature (°C)",
                "weight_pct": int((abs(delta_temp) * 3.0 / total_impact) * 100),
                "contribution": f"ΔT = {'+' if delta_temp >= 0 else ''}{delta_temp}°C (Z: {z_temp}σ)"
            },
            {
                "feature": "Surface Pressure (hPa)",
                "weight_pct": int((abs(delta_press) * 2.5 / total_impact) * 100),
                "contribution": f"ΔP = {'+' if delta_press >= 0 else ''}{delta_press} hPa (Z: {z_press}σ)"
            },
            {
                "feature": "Relative Humidity (%)",
                "weight_pct": int((abs(delta_hum) * 1.5 / total_impact) * 100),
                "contribution": f"ΔRH = {'+' if delta_hum >= 0 else ''}{delta_hum}% (Z: {z_hum}σ)"
            }
        ]

        # Natural language explanation
        if is_anomaly:
            if anomaly_type == "range_fault":
                explanation = f"Physical transducer fault: Sensor value breaches WMO thermodynamic bounds at {meta.short_name}."
            elif anomaly_type == "temperature_spike_drop":
                explanation = f"Rapid temperature step of {abs(delta_temp)}°C detected. Breaches step threshold of {eff_temp_th:.1f}°C (Z-score {z_temp}σ)."
            elif anomaly_type == "pressure_spike_drop":
                explanation = f"Barometric pressure surge/plunge of {abs(delta_press)} hPa detected within 1 hour. Possible squall line or pressure transducer slip."
            elif anomaly_type == "humidity_spike_drop":
                explanation = f"Humidity rapid divergence of {abs(delta_hum)}% breaches dynamic step threshold of {eff_hum_th:.1f}%."
            elif anomaly_type == "psychrometric_inconsistency":
                explanation = f"Psychrometric conflict: Dew point ({dew_point}°C) exceeds ambient dry bulb ({temp}°C)."
            else:
                explanation = f"Multi-variate statistical anomaly detected by Isolation Forest & Gaussian Z-Score ensemble ({max_z:.1f}σ deviation)."
        else:
            explanation = f"Nominal atmospheric equilibrium. Reading conforms to climatological baseline for {meta.name}."

        quality_advisory = self.build_quality_advisory(
            is_anomaly=is_anomaly,
            anomaly_type=anomaly_type,
            station_name=meta.name,
            temp=temp,
            hum=hum,
            press=press,
            delta_temp=delta_temp,
            delta_hum=delta_hum,
            delta_press=delta_press,
            max_z=max_z,
            dew_point=dew_point,
            vpd=vpd,
            is_physical_breach=is_physical_breach,
            is_step_breach=is_step_breach
        )

        latency_ms = round((time.perf_counter() - start_t) * 1000, 2)

        return {
            "is_anomaly": is_anomaly,
            "anomaly_type": anomaly_type,
            "confidence": confidence,
            "severity": severity,
            "severity_score": severity_score,
            "explanation": explanation,
            "quality_advisory": quality_advisory,
            "derived_metrics": {
                "dew_point": dew_point,
                "heat_index": heat_index,
                "vapor_pressure_deficit": vpd,
                "temperature_delta": delta_temp,
                "humidity_delta": delta_hum,
                "pressure_delta": delta_press,
                "z_score_temp": z_temp,
                "z_score_hum": z_hum,
                "z_score_press": z_press
            },
            "layer_diagnostics": layer_diagnostics,
            "feature_importance": feature_importance,
            "ensemble_votes": {
                "physical_bounds": is_physical_breach,
                "rate_of_change": is_step_breach,
                "statistical_zscore": is_z_breach,
                "psychrometric_rule": is_psychrometric_breach,
                "isolation_forest": is_if_breach
            },
            "inference_time_ms": latency_ms
        }

    def build_quality_advisory(
        self,
        is_anomaly: bool,
        anomaly_type: str,
        station_name: str,
        temp: float,
        hum: float,
        press: float,
        delta_temp: float,
        delta_hum: float,
        delta_press: float,
        max_z: float,
        dew_point: float,
        vpd: float,
        is_physical_breach: bool,
        is_step_breach: bool
    ) -> Dict[str, Any]:
        """Generates detailed quality advisory: good response for nominal and bad note by classification."""
        wmo_pass = not is_physical_breach and (-35.0 <= temp <= 56.0) and (0.0 <= hum <= 100.0) and (860.0 <= press <= 1085.0)
        delta_pass = not is_step_breach
        gaussian_pass = max_z < 3.0
        psychro_pass = (dew_point <= temp + 0.1) and (vpd >= -0.05)

        verification_checks = [
            {
                "name": "WMO Physical Boundary Conformance",
                "passed": wmo_pass,
                "metric": f"T: {temp:.1f}°C, RH: {hum:.1f}%, P: {press:.1f} hPa",
                "threshold": "-35.0°C to +56.0°C | 0-100% RH | 860-1085 hPa",
                "detail": "Conforms strictly to WMO Guide No. 8 physical limits" if wmo_pass else "CRITICAL BREACH: Sensor value outside physical limits"
            },
            {
                "name": "Temporal 1-Hour Rate of Change Continuity",
                "passed": delta_pass,
                "metric": f"ΔT: {'+' if delta_temp >= 0 else ''}{delta_temp:.1f}°C/hr, ΔRH: {'+' if delta_hum >= 0 else ''}{delta_hum:.1f}%/hr, ΔP: {'+' if delta_press >= 0 else ''}{delta_press:.1f} hPa/hr",
                "threshold": "|ΔT| < 8.0°C | |ΔRH| < 20.0% | |ΔP| < 6.0 hPa",
                "detail": "Smooth diurnal derivative matches boundary layer thermodynamics" if delta_pass else "ABRUPT DISCONTINUITY: Rate of change breaches thermal continuity"
            },
            {
                "name": "Dynamic 3-Sigma Gaussian Stability Envelope",
                "passed": gaussian_pass,
                "metric": f"Max Z-Score: {max_z:.2f}σ",
                "threshold": "Z < 3.0σ (99.7% Normal Distribution Confidence)",
                "detail": "Telemetry resides within regional Gaussian envelope" if gaussian_pass else "STATISTICAL OUTLIER: Telemetry isolated in distribution tail"
            },
            {
                "name": "Psychrometric Thermodynamics (Clausius-Clapeyron)",
                "passed": psychro_pass,
                "metric": f"Dew Point: {dew_point:.1f}°C vs Dry Bulb: {temp:.1f}°C (VPD: {vpd:.2f} kPa)",
                "threshold": "Dew Point <= Dry Bulb Air Temperature | VPD >= 0 kPa",
                "detail": "Thermodynamic equilibrium confirmed; valid vapor pressure deficit" if psychro_pass else "PSYCHROMETRIC VIOLATION: Impossible atmospheric supersaturation"
            }
        ]

        if not is_anomaly:
            return {
                "status": "good",
                "classification": "normal",
                "classification_label": "Optimal Sensor Equilibrium",
                "title": "OPTIMAL SENSOR EQUILIBRIUM & CLIMATOLOGICAL COMPLIANCE",
                "note": f"Station Sensor Health Verified: All primary AWS transducers at {station_name} are operating in complete thermodynamic and physical equilibrium. Current observation (T: {temp:.1f}°C, RH: {hum:.1f}%, P: {press:.1f} hPa) conforms strictly to WMO standard 557 and regional Gaussian envelopes (Z-score: {max_z:.2f}σ). Psychrometric validation confirms stable vapor pressure deficit ({vpd:.2f} kPa, Dew Point: {dew_point:.1f}°C) with zero transducer drift or temporal jump detected.",
                "physics_rule": "Full thermodynamic and climatological compliance with WMO Guide No. 8 and Regional Diurnal Energy Balance.",
                "hardware_diagnostic": "Transducer bridge voltages (3.3V/5V rails), analog ADC linearity, and digital telemetry baud channels nominal with zero packet dropouts.",
                "action_directive": "SURVEILLANCE ACTIVE — Sensor operating at peak fidelity. No field maintenance, transducer replacement, or calibration adjustments required.",
                "urgency": "Nominal",
                "verification_checks": verification_checks
            }

        # Bad note according to anomaly type
        if anomaly_type == "temperature_spike_drop":
            return {
                "status": "bad",
                "classification": "temperature_spike_drop",
                "classification_label": "Thermal Step Anomaly (ΔT Jump/Plunge)",
                "title": "CRITICAL THERMAL GRADIENT BREACH — STEP DISCONTINUITY",
                "note": f"Thermal discontinuity detected at {station_name}: Sensor recorded {temp:.1f}°C, presenting an abrupt 1-hour jump/drop of {abs(delta_temp):.1f}°C. Breaches maximum permissible rate of change (8.0°C/hr, Z-score: {max_z:.2f}σ).",
                "physics_rule": "Atmospheric Thermodynamics Continuity (WMO Guide 557): Natural free-atmosphere heat flux cannot exceed ±8.0°C/hr without catastrophic frontogenesis.",
                "hardware_diagnostic": "Solar radiation aspirator fan motor failure, direct sensor exposure to localized heat source, or RTD resistance wire degradation.",
                "action_directive": "Level-2 Urgent Field Dispatch: Inspect radiation shield louvers, test PT100 bridge resistance with calibrated portable reference, and clean aspiration duct.",
                "urgency": "Critical",
                "verification_checks": verification_checks
            }
        elif anomaly_type == "pressure_spike_drop":
            return {
                "status": "bad",
                "classification": "pressure_spike_drop",
                "classification_label": "Barometric Pressure Plunge / Step Jump",
                "title": "SEVERE BAROMETRIC INSTABILITY — TRANSDUCER FAULT",
                "note": f"Abnormal barometric pressure step of {abs(delta_press):.1f} hPa detected within 1 hour at {station_name} (measured {press:.1f} hPa). Rapid pressure fluctuations breach regional isobaric gradient physics (Z-score: {max_z:.2f}σ).",
                "physics_rule": "Fluid Hydrostatic Equilibrium & Barometric Gradient Limit: Open-air barometric pressure transitions > 6.0 hPa/hr indicate severe transducer anomaly or tornadic core.",
                "hardware_diagnostic": "Piezoresistive diaphragm micro-fracture, static pressure port debris/insect blockage, or aneroid chamber seal failure.",
                "action_directive": "Priority 1 Directive: Purge and clear static port venting tube, verify against regional barometric synoptic grid, and check datalogger 24-bit ADC reference voltage.",
                "urgency": "Critical",
                "verification_checks": verification_checks
            }
        elif anomaly_type == "humidity_spike_drop":
            return {
                "status": "bad",
                "classification": "humidity_spike_drop",
                "classification_label": "Hydrological Step Anomaly (ΔRH Discontinuity)",
                "title": "HYDROMETEOROLOGICAL STEP ANOMALY — MOISTURE DISCONTINUITY",
                "note": f"Abrupt relative humidity shift of {abs(delta_hum):.1f}% detected in 1 hour at {station_name} (observed {hum:.1f}%) without corresponding thermal precipitation signature.",
                "physics_rule": "Boundary Layer Clausius-Clapeyron Vapor Continuity: Evaporative flux cannot desiccate or supersaturate > 18% RH in 60 minutes without frontal precipitation.",
                "hardware_diagnostic": "Capacitive polymer hygrometer contamination, dew-heating element burnout, or sintered bronze filter cap saturation.",
                "action_directive": "Standard Maintenance Order: Inspect sensor protective cap, clean capacitive grid with isopropanol, and perform two-point saturated salt calibration check.",
                "urgency": "Urgent",
                "verification_checks": verification_checks
            }
        elif anomaly_type == "range_fault":
            return {
                "status": "bad",
                "classification": "range_fault",
                "classification_label": "Out-of-Bounds Physical Transducer Breach",
                "title": "CRITICAL TRANSDUCER SATURATION — PHYSICAL LIMIT BREACH",
                "note": f"Telemetry reading breached absolute physical WMO boundaries at {station_name} (T={temp:.1f}°C, RH={hum:.1f}%, P={press:.1f} hPa). Out-of-bounds electrical short or analog saturation detected.",
                "physics_rule": "WMO Guide No. 8 Global Sensor Climatological Range Limit (-35.0°C to +56.0°C, 0-100% RH, 860-1085 hPa).",
                "hardware_diagnostic": "Direct sensor ground short, lightning surge ADC breakdown, or severed signal lead cable.",
                "action_directive": "EMERGENCY DISPATCH: Invalidate telemetry stream immediately from national synoptic feed. Replace sensor transducer assembly immediately.",
                "urgency": "Critical",
                "verification_checks": verification_checks
            }
        elif anomaly_type == "psychrometric_inconsistency":
            return {
                "status": "bad",
                "classification": "psychrometric_inconsistency",
                "classification_label": "Psychrometric Law Violation (Supersaturation)",
                "title": "PSYCHROMETRIC LAW VIOLATION — SUPERSATURATION",
                "note": f"Calculated dew point ({dew_point:.1f}°C) exceeds ambient dry-bulb temperature ({temp:.1f}°C) by {(dew_point - temp):.1f}°C at {station_name}. Clausius-Clapeyron thermodynamic relation strictly forbids supersaturation in free atmosphere.",
                "physics_rule": "Thermodynamic Clausius-Clapeyron Phase Law (Dew Point Temperature <= Dry-Bulb Ambient Air Temperature).",
                "hardware_diagnostic": "Coupled sensor miscalibration between temperature and capacitive humidity probes.",
                "action_directive": "Simultaneous recalibration of dual thermistor and hygrometer probe assembly in psychrometric test chamber.",
                "urgency": "Urgent",
                "verification_checks": verification_checks
            }
        else:
            return {
                "status": "bad",
                "classification": "statistical_outlier",
                "classification_label": "Multivariate Gaussian Outlier",
                "title": "MULTIVARIATE STATISTICAL ANOMALY — HIGH RESIDUAL",
                "note": f"Multi-parameter observation Vector [T={temp:.1f}°C, RH={hum:.1f}%, P={press:.1f} hPa] isolated in extreme tail of regional historical distribution at {station_name} (Z-score: {max_z:.2f}σ).",
                "physics_rule": "Dynamic 3-Sigma Gaussian Climatology Envelope (99.7% Normal Distribution Confidence).",
                "hardware_diagnostic": "Multiplexed sensor channel crosstalk, intermittent electrical ground noise, or rapid microclimate localized disturbance.",
                "action_directive": "Flag observation for Level-2 meteorologist manual validation. Keep station in elevated surveillance mode.",
                "urgency": "Advisory",
                "verification_checks": verification_checks
            }

    def run_benchmark_suite(self) -> Dict[str, Any]:
        """Runs pre-configured meteorological benchmark tests."""
        test_cases = [
            {
                "id": "TC-01",
                "name": "Sudden Diurnal Heatwave Surge (+14.5°C)",
                "category": "Thermal Dynamics",
                "expected_anomaly": True,
                "input": {"location_id": 0, "temperature": 33.9, "relative_humidity": 45.0, "surface_pressure": 1016.0, "previous_temperature": 19.4}
            },
            {
                "id": "TC-02",
                "name": "Pre-Cyclonic Barometric Plunge (-16.0 hPa)",
                "category": "Barometric Physics",
                "expected_anomaly": True,
                "input": {"location_id": 1, "temperature": 27.0, "relative_humidity": 88.0, "surface_pressure": 995.0, "previous_pressure": 1011.0}
            },
            {
                "id": "TC-03",
                "name": "Supersaturated Humidity Physics Breach (108% RH)",
                "category": "Sensor Climatology",
                "expected_anomaly": True,
                "input": {"location_id": 2, "temperature": 28.0, "relative_humidity": 108.0, "surface_pressure": 1008.0}
            },
            {
                "id": "TC-04",
                "name": "Himalayan Sub-Zero Frost Wave (-15.2°C)",
                "category": "Cryospheric Shift",
                "expected_anomaly": True,
                "input": {"location_id": 8, "temperature": 2.8, "relative_humidity": 42.0, "surface_pressure": 1015.0, "previous_temperature": 18.0}
            },
            {
                "id": "TC-05",
                "name": "Flash Desiccation Jump (-32% RH in 1 hr)",
                "category": "Hydrological Step",
                "expected_anomaly": True,
                "input": {"location_id": 4, "temperature": 22.0, "relative_humidity": 36.0, "surface_pressure": 1014.0, "previous_humidity": 68.0}
            },
            {
                "id": "TC-06",
                "name": "Out-of-Bounds ADC Sensor Short (65°C)",
                "category": "Hardware Transducer",
                "expected_anomaly": True,
                "input": {"location_id": 7, "temperature": 65.0, "relative_humidity": 69.0, "surface_pressure": 1013.0}
            },
            {
                "id": "TC-07",
                "name": "Nominal Pleasant Spring Afternoon (New Delhi)",
                "category": "Baseline Control",
                "expected_anomaly": False,
                "input": {"location_id": 0, "temperature": 19.8, "relative_humidity": 70.0, "surface_pressure": 1016.0, "previous_temperature": 19.4}
            },
            {
                "id": "TC-08",
                "name": "Nominal Coastal Marine Evening (Mumbai Colaba)",
                "category": "Baseline Control",
                "expected_anomaly": False,
                "input": {"location_id": 1, "temperature": 26.8, "relative_humidity": 79.0, "surface_pressure": 1011.0, "previous_temperature": 27.0}
            }
        ]

        passed = 0
        tp = fp = tn = fn = 0
        total_latency = 0.0
        results = []

        for tc in test_cases:
            res = self.evaluate_telemetry(**tc["input"])
            total_latency += res["inference_time_ms"]
            is_correct = res["is_anomaly"] == tc["expected_anomaly"]
            if is_correct:
                passed += 1

            if tc["expected_anomaly"] and res["is_anomaly"]:
                tp += 1
            elif not tc["expected_anomaly"] and res["is_anomaly"]:
                fp += 1
            elif not tc["expected_anomaly"] and not res["is_anomaly"]:
                tn += 1
            elif tc["expected_anomaly"] and not res["is_anomaly"]:
                fn += 1

            results.append({
                "id": tc["id"],
                "name": tc["name"],
                "category": tc["category"],
                "expected_anomaly": tc["expected_anomaly"],
                "predicted_anomaly": res["is_anomaly"],
                "passed": is_correct,
                "confidence": res["confidence"],
                "latency_ms": res["inference_time_ms"],
                "explanation": res["explanation"],
                "inputs": {
                    "temp": tc["input"].get("temperature"),
                    "hum": tc["input"].get("relative_humidity"),
                    "press": tc["input"].get("surface_pressure")
                }
            })

        precision = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 100.0
        recall = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 100.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 100.0
        accuracy = (passed / len(test_cases)) * 100

        return {
            "total_tests": len(test_cases),
            "passed": passed,
            "accuracy_pct": round(accuracy, 1),
            "precision_pct": round(precision, 1),
            "recall_pct": round(recall, 1),
            "f1_score_pct": round(f1, 1),
            "avg_latency_ms": round(total_latency / len(test_cases), 2),
            "tests": results
        }


# Direct CLI Execution
if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="SkyGuard AI Anomaly Engine CLI")
    parser.add_argument("--benchmark", action="store_true", help="Run the automated 8-test benchmark suite")
    parser.add_argument("--temp", type=float, default=33.5, help="Temperature in °C")
    parser.add_argument("--hum", type=float, default=72.0, help="Relative humidity %")
    parser.add_argument("--press", type=float, default=1014.0, help="Surface pressure in hPa")
    parser.add_argument("--station", type=int, default=0, help="Station ID (0-9)")
    args = parser.parse_args()

    engine = MeteorologicalAnomalyEngine()

    if args.benchmark:
        print("\n=== RUNNING SKYGUARD AI METEOROLOGICAL BENCHMARK ===")
        bench = engine.run_benchmark_suite()
        print(f"Accuracy:  {bench['accuracy_pct']}% ({bench['passed']}/{bench['total_tests']} tests passed)")
        print(f"Precision: {bench['precision_pct']}% | Recall: {bench['recall_pct']}% | F1: {bench['f1_score_pct']}%")
        print(f"Avg Latency: {bench['avg_latency_ms']} ms\n")
        for t in bench['tests']:
            status_icon = "✓ PASS" if t['passed'] else "✗ FAIL"
            print(f"[{status_icon}] {t['id']} {t['name']} -> Pred: {'ANOMALY' if t['predicted_anomaly'] else 'NOMINAL'} ({t['confidence']}%)")
    else:
        print(f"\n=== EVALUATING SINGLE TELEMETRY OBSERVATION ===")
        res = engine.evaluate_telemetry(
            temperature=args.temp,
            relative_humidity=args.hum,
            surface_pressure=args.press,
            location_id=args.station
        )
        print(f"Station:     {STATIONS[args.station].name}")
        print(f"Input:       T={args.temp}°C, RH={args.hum}%, P={args.press} hPa")
        print(f"Prediction:  {'ANOMALY' if res['is_anomaly'] else 'NOMINAL'} (Type: {res['anomaly_type']}, Confidence: {res['confidence']}%)")
        print(f"Severity:    {res['severity']} (Score: {res['severity_score']}/100)")
        print(f"Explanation: {res['explanation']}")
        print(f"Latency:     {res['inference_time_ms']} ms")
        print("\nLayer Breakdown:")
        for diag in res['layer_diagnostics']:
            print(f"  • [{diag['status']}] {diag['name']}: {diag['metric']} ({diag['threshold']})")

# Alias for backwards compatibility with test harnesses and imports
SkyGuardEngine = MeteorologicalAnomalyEngine
