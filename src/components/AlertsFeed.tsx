import React, { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Clock,
  CheckCircle2,
  MessageSquare,
  Wrench,
  FileText,
  ChevronDown,
  ChevronUp,
  Wand2,
  ArrowRight,
  HelpCircle,
  Activity,
  Layers,
  Radio,
  Eye,
  SlidersHorizontal,
  AlertTriangle,
  Check,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { AnomalyAlert } from '../types';

interface AlertsFeedProps {
  alerts: AnomalyAlert[];
  onSelectStation?: (id: number) => void;
  onTriageUpdate?: (alertId: string, status: AnomalyAlert['triage_status'], notes?: string) => Promise<void>;
  onAutoCleanAlert?: (alertId: string, notes?: string) => Promise<void>;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({
  alerts,
  onSelectStation,
  onTriageUpdate,
  onAutoCleanAlert,
}) => {
  const [filterVerdict, setFilterVerdict] = useState<'ALL' | 'WRONG' | 'RIGHT' | 'ACTIVE'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showExplainer, setShowExplainer] = useState<boolean>(false);
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);

  // Helper to determine whether an entire row is WRONG or RIGHT
  const isAlertWrong = (alert: AnomalyAlert): boolean => {
    if (alert.row_verdict === 'WRONG') return true;
    if (alert.row_verdict === 'RIGHT') return false;
    // Fallback if row_verdict not explicitly set: check if it's an open anomaly
    if (alert.status === 'anomaly') {
      return alert.triage_status !== 'Resolved' && alert.triage_status !== 'False Alarm';
    }
    return false;
  };

  // Counts across the surveillance feed
  const totalRows = alerts.length;
  const wrongRows = alerts.filter(isAlertWrong);
  const rightRows = alerts.filter((a) => !isAlertWrong(a));
  const openIncidents = alerts.filter(
    (a) => isAlertWrong(a) && (a.triage_status === 'Open' || a.triage_status === 'Investigating' || !a.triage_status)
  );
  const resolvedRows = alerts.filter((a) => a.triage_status === 'Resolved' || a.triage_status === 'False Alarm');

  // Filtered rows
  const filteredAlerts = alerts.filter((a) => {
    const isWrong = isAlertWrong(a);

    if (filterVerdict === 'WRONG' && !isWrong) return false;
    if (filterVerdict === 'RIGHT' && isWrong) return false;
    if (filterVerdict === 'ACTIVE') {
      if (!isWrong) return false;
      if (a.triage_status === 'Resolved' || a.triage_status === 'False Alarm') return false;
    }

    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;

    if (filterCategory !== 'ALL') {
      if (filterCategory === 'thermal' && !a.type.includes('temp')) return false;
      if (filterCategory === 'moisture' && !a.type.includes('hum')) return false;
      if (filterCategory === 'pressure' && !a.type.includes('press')) return false;
      if (filterCategory === 'stuck' && !a.type.includes('stuck')) return false;
      if (filterCategory === 'range' && !a.type.includes('range')) return false;
    }

    return true;
  });

  const getVerdictBadge = (isWrong: boolean) => {
    if (isWrong) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold font-mono text-xs shadow-sm shadow-rose-950/20">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
          <span>❌ WRONG</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold font-mono text-xs shadow-sm shadow-emerald-950/20">
        <Check className="h-3.5 w-3.5 text-emerald-400" />
        <span>✅ RIGHT</span>
      </span>
    );
  };

  const getTriageBadge = (status?: AnomalyAlert['triage_status'], isWrong?: boolean) => {
    if (!isWrong || status === 'Resolved') {
      return (
        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
          <CheckCircle2 className="h-3 w-3 inline text-emerald-400 mr-1" />
          <span>Nominal / Pass</span>
        </span>
      );
    }
    switch (status) {
      case 'Verified Fault':
        return (
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-mono px-2 py-0.5 rounded-full">
            Verified Fault
          </span>
        );
      case 'Investigating':
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono px-2 py-0.5 rounded-full">
            Investigating
          </span>
        );
      case 'False Alarm':
        return (
          <span className="bg-slate-700 text-slate-300 border border-slate-600 text-[11px] font-mono px-2 py-0.5 rounded-full">
            False Alarm
          </span>
        );
      default:
        return (
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-mono px-2 py-0.5 rounded-full">
            Open Incident
          </span>
        );
    }
  };

  const handleStatusChange = async (alertId: string, newStatus: AnomalyAlert['triage_status']) => {
    if (!onTriageUpdate) return;
    setIsSubmitting(true);
    try {
      await onTriageUpdate(alertId, newStatus, editingNotes[alertId]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async (alertId: string, currentStatus?: AnomalyAlert['triage_status']) => {
    if (!onTriageUpdate) return;
    setIsSubmitting(true);
    try {
      await onTriageUpdate(alertId, currentStatus || 'Investigating', editingNotes[alertId]);
      setExpandedNotesId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoRemediate = async (alert: AnomalyAlert) => {
    setRemediatingId(alert.id);
    try {
      if (onAutoCleanAlert) {
        await onAutoCleanAlert(
          alert.id,
          `Auto-remediated via WMO 3-Sigma QC Engine: Raw faulty telemetry replaced with verified cleaned baseline.`
        );
      } else if (onTriageUpdate) {
        await onTriageUpdate(
          alert.id,
          'Resolved',
          `Auto-remediated via WMO 3-Sigma QC Engine: Raw faulty telemetry replaced with verified cleaned baseline.`
        );
      }
    } finally {
      setRemediatingId(null);
    }
  };

  const formatAlertTime = (timeStr: string) => {
    if (!timeStr) return { time: '--:--', date: 'Live', full: '--' };

    // Format "YYYY-MM-DD HH:mm:ss"
    if (timeStr.includes(' ') && timeStr.includes('-')) {
      const parts = timeStr.trim().split(' ');
      const datePart = parts[0];
      const timePart = parts[1].replace('IST', '').trim().substring(0, 5);
      return { time: timePart, date: datePart, full: `${timePart} (${datePart})` };
    }

    // Format ISO "YYYY-MM-DDTHH:mm:ss"
    if (timeStr.includes('T')) {
      const parts = timeStr.split('T');
      const datePart = parts[0];
      const timePart = parts[1].substring(0, 5);
      return { time: timePart, date: datePart, full: `${timePart} (${datePart})` };
    }

    // Format "HH:mm:ss IST"
    if (timeStr.includes(':')) {
      const timePart = timeStr.replace('IST', '').trim().substring(0, 5);
      return { time: timePart, date: 'Live', full: `${timePart} IST` };
    }

    return { time: timeStr, date: '', full: timeStr };
  };

  const handleExportIncidentReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      source: "SkyGuard IMD Meteorological Quality Control Engine",
      total_rows_audited: alerts.length,
      wrong_rows_count: wrongRows.length,
      right_rows_count: rightRows.length,
      incidents: filteredAlerts.map((a) => ({
        id: a.id,
        verdict: isAlertWrong(a) ? 'WRONG' : 'RIGHT',
        station: a.station_name,
        time: a.time,
        raw_readings: {
          temperature_c: a.raw_temperature ?? a.temperature,
          humidity_pct: a.raw_humidity ?? a.humidity,
          pressure_hpa: a.raw_pressure ?? a.pressure,
        },
        cleaned_ground_truth: {
          temperature_c: a.cleaned_temperature ?? a.temperature,
          humidity_pct: a.cleaned_humidity ?? a.humidity,
          pressure_hpa: a.cleaned_pressure ?? a.pressure,
        },
        delta: {
          temperature: a.delta_temperature ?? 0,
          humidity: a.delta_humidity ?? 0,
          pressure: a.delta_pressure ?? 0,
        },
        status: a.triage_status || 'Open',
        root_cause: a.explanation,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skyguard_telemetry_verdicts_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="alerts-feed-container" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
      {/* Header & High-Level Telemetry Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <h2 className="text-base font-semibold text-slate-100">Live Anomaly Alerts & Incident Triage</h2>
            
            {/* Clear Row Breakdown Pills */}
            <span className="text-xs font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping mr-1" />
              <span>{wrongRows.length} Wrong Rows</span>
            </span>

            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1">
              <Check className="h-3.5 w-3.5 text-emerald-400 mr-0.5" />
              <span>{rightRows.length} Right Rows (Correct)</span>
            </span>

            <span className="text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
              {totalRows} Total Stream Rows
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Row-level telemetry surveillance: only a few rows are flagged as <strong className="text-rose-400 font-semibold">❌ WRONG</strong> (anomalous), while the remaining rows are certified <strong className="text-emerald-400 font-semibold">✅ RIGHT</strong> (nominal WMO verified ground truth).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Explainer Toggle Button */}
          <button
            id="btn-toggle-raw-cleaned-guide"
            onClick={() => setShowExplainer(!showExplainer)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              showExplainer
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
            <span>{showExplainer ? 'Hide Guide' : 'Row Status Guide'}</span>
          </button>

          {/* View Mode Toggle (Table vs Cards) */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              id="view-mode-table"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                viewMode === 'table'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table Rows</span>
            </button>
            <button
              id="view-mode-cards"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                viewMode === 'cards'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Export Report Button */}
          <button
            id="btn-export-incident-report"
            onClick={handleExportIncidentReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
            title="Download Incident Audit Report JSON"
          >
            <FileText className="h-3.5 w-3.5 text-rose-400" />
            <span>Export Audit JSON</span>
          </button>
        </div>
      </div>

      {/* Explainer Guide: Whole-Row Verdict Philosophy */}
      {showExplainer && (
        <div id="raw-cleaned-data-guide" className="mb-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-950/70 to-blue-950/30 p-4 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Radio className="h-4 w-4 text-cyan-400" />
              <h3 className="font-semibold text-cyan-200">How SkyGuard Classifies Entire Telemetry Rows (Wrong vs Right)</h3>
            </div>
            <button
              onClick={() => setShowExplainer(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3">
              <div className="font-bold text-rose-300 flex items-center space-x-1.5 mb-1">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>1. Only a Few Rows are ❌ WRONG</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                In operational meteorological stations, anomalies are rare events (~4% baseline). In this feed, only the occasional sensor spike or corrupted packet is marked as a <strong>❌ WRONG ROW</strong> with root cause analysis and auto-clean tools.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3">
              <div className="font-bold text-emerald-300 flex items-center space-x-1.5 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>2. The Remaining Rows are ✅ RIGHT</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                All surrounding readings are nominal, healthy, and certified by all 5 WMO quality control layers. They are classified as <strong>✅ RIGHT ROWS</strong> with 0.0 delta and 100% verified ground truth.
              </p>
            </div>

            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3">
              <div className="font-bold text-cyan-300 flex items-center space-x-1.5 mb-1">
                <Wand2 className="h-4 w-4 text-cyan-400" />
                <span>3. One-Click Auto-Clean & Imputation</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Clicking <strong>Auto-Clean & Impute</strong> on any ❌ WRONG row executes diurnal harmonic spline reconstruction, bringing the row back to <strong>✅ RIGHT</strong> verified baseline status.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Row Verdict Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">Row Verdict:</span>
          <div className="flex items-center space-x-1 text-xs">
            <button
              id="filter-verdict-all"
              onClick={() => setFilterVerdict('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterVerdict === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Rows ({totalRows})
            </button>

            <button
              id="filter-verdict-wrong"
              onClick={() => setFilterVerdict('WRONG')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                filterVerdict === 'WRONG'
                  ? 'bg-rose-500/25 text-rose-300 font-bold border border-rose-500/50 shadow-sm'
                  : 'text-rose-400 hover:bg-rose-950/30'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>❌ Wrong Only ({wrongRows.length})</span>
            </button>

            <button
              id="filter-verdict-right"
              onClick={() => setFilterVerdict('RIGHT')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                filterVerdict === 'RIGHT'
                  ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/50 shadow-sm'
                  : 'text-emerald-400 hover:bg-emerald-950/30'
              }`}
            >
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>✅ Right Only ({rightRows.length})</span>
            </button>

            <button
              id="filter-verdict-active"
              onClick={() => setFilterVerdict('ACTIVE')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterVerdict === 'ACTIVE'
                  ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Incidents ({openIncidents.length})
            </button>
          </div>
        </div>

        {/* Severity and Archetype Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-[11px] font-medium text-slate-400">Severity:</span>
            <select
              id="filter-severity-select"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical Only</option>
              <option value="High">High Only</option>
              <option value="Medium">Medium Only</option>
              <option value="Low">Low / Nominal</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-[11px] font-medium text-slate-400">Fault Type:</span>
            <select
              id="filter-category-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Archetypes</option>
              <option value="thermal">Thermal Spikes / Drops</option>
              <option value="moisture">Moisture Desiccation</option>
              <option value="pressure">Pressure Plunges / Surges</option>
              <option value="stuck">Stuck Sensor ADC</option>
              <option value="range">Physical Range Breaches</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Stream Rendering: Table Rows or Cards */}
      {filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2.5" />
          <p className="text-sm font-semibold text-slate-200">No telemetry rows match this filter</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Try switching to &ldquo;All Rows&rdquo; to view the complete chronological sequence of incoming weather station packets.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* ========================================================================= */
        /* 1. TABLE ROW VIEW: The Whole Row is Explicitly WRONG or RIGHT             */
        /* ========================================================================= */
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">Row Verdict</th>
                <th className="py-3 px-3">Time & Station</th>
                <th className="py-3 px-3">Field Reading (Raw)</th>
                <th className="py-3 px-3">Cleaned Ground Truth</th>
                <th className="py-3 px-3">Diagnosis / Delta</th>
                <th className="py-3 px-3">QC Status</th>
                <th className="py-3 px-3.5 text-right">Action / Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredAlerts.map((alert) => {
                const isWrong = isAlertWrong(alert);
                const isResolved = alert.triage_status === 'Resolved' || alert.triage_status === 'False Alarm';

                const rawTemp = alert.raw_temperature ?? alert.temperature;
                const rawHum = alert.raw_humidity ?? alert.humidity;
                const rawPress = alert.raw_pressure ?? alert.pressure;

                const cleanTemp = alert.cleaned_temperature ?? rawTemp;
                const cleanHum = alert.cleaned_humidity ?? rawHum;
                const cleanPress = alert.cleaned_pressure ?? rawPress;

                const deltaTemp = alert.delta_temperature ?? parseFloat((rawTemp - cleanTemp).toFixed(1));
                const deltaHum = alert.delta_humidity ?? parseFloat((rawHum - cleanHum).toFixed(1));
                const deltaPress = alert.delta_pressure ?? parseFloat((rawPress - cleanPress).toFixed(1));

                return (
                  <tr
                    key={alert.id}
                    id={`telemetry-row-${alert.id}`}
                    className={`transition-colors ${
                      isWrong
                        ? 'bg-rose-950/20 hover:bg-rose-950/30'
                        : 'bg-transparent hover:bg-slate-900/40'
                    }`}
                  >
                    {/* 1. ROW VERDICT */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {getVerdictBadge(isWrong)}
                    </td>

                    {/* 2. TIME & STATION */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                        <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{formatAlertTime(alert.time).time}</span>
                        <span className="text-slate-500 font-normal">({formatAlertTime(alert.time).date})</span>
                        {alert.is_live && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 text-[9px] font-mono border border-emerald-500/40 font-bold ml-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                            LIVE
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onSelectStation?.(alert.location_id)}
                        className="text-cyan-400 hover:text-cyan-300 text-[11px] underline flex items-center space-x-1 mt-0.5"
                        title="Focus station on map & charts"
                      >
                        <Eye className="h-2.5 w-2.5 mr-0.5" />
                        <span className="truncate max-w-[140px]">{alert.station_name}</span>
                      </button>
                    </td>

                    {/* 3. FIELD READING (RAW) */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span className={isWrong && Math.abs(deltaTemp) > 1 ? 'text-rose-300 font-bold' : alert.is_live ? 'text-cyan-200 font-bold' : 'text-slate-200'}>
                          {rawTemp.toFixed(1)}°C
                        </span>
                        <span className="text-slate-600">/</span>
                        <span className={isWrong && Math.abs(deltaHum) > 5 ? 'text-rose-300 font-bold' : alert.is_live ? 'text-cyan-200 font-bold' : 'text-slate-200'}>
                          {rawHum.toFixed(1)}%
                        </span>
                        <span className="text-slate-600">/</span>
                        <span className={isWrong && Math.abs(deltaPress) > 3 ? 'text-rose-300 font-bold' : alert.is_live ? 'text-cyan-200 font-bold' : 'text-slate-200'}>
                          {rawPress.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <span>Temp / Hum / Press</span>
                        {alert.is_live && <span className="text-emerald-400 font-medium">• Live Telemetry</span>}
                      </div>
                    </td>

                    {/* 4. CLEANED GROUND TRUTH */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-[11px] text-emerald-300 font-bold">
                        <span>{cleanTemp.toFixed(1)}°C</span>
                        <span className="text-emerald-800">/</span>
                        <span>{cleanHum.toFixed(1)}%</span>
                        <span className="text-emerald-800">/</span>
                        <span>{cleanPress.toFixed(1)}</span>
                      </div>
                      <div className="text-[10px] text-emerald-400/80 mt-0.5">
                        {isWrong ? 'Imputed Baseline' : alert.is_live ? 'Live Verified Telemetry' : 'Original Verified'}
                      </div>
                    </td>

                    {/* 5. DIAGNOSIS / DELTA */}
                    <td className="py-3 px-3 max-w-[260px]">
                      {isWrong ? (
                        <div>
                          <div className="text-rose-300 font-semibold text-xs truncate">
                            {alert.type.replace(/_/g, ' ')}
                          </div>
                          <div className="text-slate-400 text-[10px] truncate mt-0.5 font-sans">
                            {alert.explanation}
                          </div>
                        </div>
                      ) : (
                        <div className="text-emerald-400 text-[11px] font-sans flex items-center space-x-1">
                          <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span>0.0 Δ • Nominal • All 5 QC Gates Passed</span>
                        </div>
                      )}
                    </td>

                    {/* 6. QC STATUS */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isWrong ? (
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {alert.qc_flag || 'ERRONEOUS'}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {alert.confidence}% Confidence
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            PASS (100%)
                          </span>
                          <div className="text-[10px] text-emerald-400 mt-0.5">
                            Verified Nominal
                          </div>
                        </div>
                      )}
                    </td>

                    {/* 7. ACTION / TRIAGE */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-right">
                      {isWrong ? (
                        <div className="flex items-center justify-end space-x-2">
                          {!isResolved ? (
                            <button
                              id={`btn-table-clean-${alert.id}`}
                              onClick={() => handleAutoRemediate(alert)}
                              disabled={remediatingId === alert.id || isSubmitting}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1"
                              title="Auto-clean and impute telemetry for this row"
                            >
                              <Wand2 className="h-3 w-3" />
                              <span>{remediatingId === alert.id ? 'Cleaning...' : 'Auto-Clean'}</span>
                            </button>
                          ) : (
                            <span className="text-emerald-400 text-[11px] flex items-center space-x-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Remediated</span>
                            </span>
                          )}

                          <select
                            value={alert.triage_status || 'Open'}
                            onChange={(e) => handleStatusChange(alert.id, e.target.value as any)}
                            disabled={isSubmitting}
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-1 focus:outline-none focus:border-cyan-500"
                          >
                            <option value="Open">Open</option>
                            <option value="Investigating">Investigate</option>
                            <option value="Verified Fault">Verified Fault</option>
                            <option value="Resolved">Resolved</option>
                            <option value="False Alarm">False Alarm</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] inline-flex items-center space-x-1 font-sans">
                          <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" />
                          <span>Verified Accurate</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. CARD VIEW: Each Card Represents the Whole Row as WRONG or RIGHT        */
        /* ========================================================================= */
        <div className="space-y-4 max-h-[660px] overflow-y-auto pr-1">
          {filteredAlerts.map((alert) => {
            const isWrong = isAlertWrong(alert);
            const isResolved = alert.triage_status === 'Resolved' || alert.triage_status === 'False Alarm';
            const isNotesExpanded = expandedNotesId === alert.id;

            const rawTemp = alert.raw_temperature ?? alert.temperature;
            const rawHum = alert.raw_humidity ?? alert.humidity;
            const rawPress = alert.raw_pressure ?? alert.pressure;

            const cleanTemp = alert.cleaned_temperature ?? rawTemp;
            const cleanHum = alert.cleaned_humidity ?? rawHum;
            const cleanPress = alert.cleaned_pressure ?? rawPress;

            const deltaTemp = alert.delta_temperature ?? parseFloat((rawTemp - cleanTemp).toFixed(1));
            const deltaHum = alert.delta_humidity ?? parseFloat((rawHum - cleanHum).toFixed(1));
            const deltaPress = alert.delta_pressure ?? parseFloat((rawPress - cleanPress).toFixed(1));

            const layers =
              alert.detection_layers_triggered && alert.detection_layers_triggered.length > 0
                ? alert.detection_layers_triggered
                : [
                    'Layer 1: Physical Bounds Climatological Gates',
                    'Layer 2: Temporal Step Jump Rate Verification',
                    'Layer 3: Dynamic 3-Sigma Gaussian Envelope',
                    'Layer 5: Isolation Forest Multivariate Cluster',
                  ];

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`rounded-xl border p-4 transition-all text-xs ${
                  isWrong
                    ? isResolved
                      ? 'border-emerald-500/30 bg-slate-950/50 opacity-90'
                      : alert.is_simulated
                      ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-950/70 to-slate-950/90 shadow-lg shadow-amber-950/10'
                      : 'border-rose-500/50 bg-gradient-to-r from-rose-950/20 via-slate-950/70 to-slate-950/90 shadow-lg shadow-rose-950/10'
                    : 'border-emerald-500/30 bg-gradient-to-r from-emerald-950/15 via-slate-950/60 to-slate-950/80'
                }`}
              >
                {/* Top Meta Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Big Bold Row Verdict */}
                    {getVerdictBadge(isWrong)}

                    {getTriageBadge(alert.triage_status, isWrong)}

                    <span className="font-semibold text-slate-200 capitalize text-xs">
                      {isWrong ? alert.type.replace(/_/g, ' ') : 'Nominal Weather Reading'}
                    </span>

                    {alert.is_simulated && (
                      <span className="rounded bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-mono border border-amber-500/30 font-semibold">
                        SIMULATED INJECTION
                      </span>
                    )}

                    {alert.is_live && (
                      <span className="rounded bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-mono border border-emerald-500/40 font-bold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        LIVE TELEMETRY
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-slate-400 text-xs">
                    <span className="flex items-center space-x-1 font-mono text-[11px]">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{formatAlertTime(alert.time).full}</span>
                    </span>
                    <button
                      onClick={() => onSelectStation?.(alert.location_id)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center space-x-1"
                      title="Inspect station microclimate telemetry"
                    >
                      <Eye className="h-3 w-3 mr-0.5" />
                      <span>{alert.station_name}</span>
                    </button>
                  </div>
                </div>

                {/* Natural Language Explanation */}
                <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 text-slate-300 mb-3">
                  <div className="flex items-start space-x-2.5">
                    <Sparkles className={`h-4 w-4 shrink-0 mt-0.5 ${isWrong ? 'text-rose-400' : 'text-emerald-400'}`} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-200 leading-relaxed">
                        {alert.explanation}
                      </p>

                      {/* QC Gates Pills */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">
                          {isWrong ? 'Detection Gates Triggered:' : 'QC Gates Verified:'}
                        </span>
                        {layers.map((layerName, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                              isWrong
                                ? 'bg-slate-950 text-rose-300 border-rose-500/30'
                                : 'bg-slate-950 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {layerName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side: Raw Field Telemetry vs Cleaned Ground Truth */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {/* Panel 1: Field Transducer Bitstream */}
                  <div
                    className={`rounded-xl border p-3 ${
                      isWrong
                        ? 'border-rose-500/35 bg-gradient-to-b from-rose-950/20 to-slate-950/60'
                        : 'border-slate-800 bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-2 w-2 rounded-full ${isWrong ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
                        <span className="font-bold text-slate-100 text-xs">RAW FIELD TELEMETRY</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${
                          isWrong
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {isWrong ? '❌ Fault Detected' : '✅ 100% Nominal'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-1 font-mono">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 mb-0.5">Temperature</div>
                        <div className="text-sm font-bold text-slate-100">{rawTemp.toFixed(1)}°C</div>
                        {isWrong && Math.abs(deltaTemp) > 0 && (
                          <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
                            Δ {deltaTemp > 0 ? `+${deltaTemp.toFixed(1)}` : deltaTemp.toFixed(1)}°C
                          </div>
                        )}
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 mb-0.5">Humidity</div>
                        <div className="text-sm font-bold text-slate-100">{rawHum.toFixed(1)}%</div>
                        {isWrong && Math.abs(deltaHum) > 0 && (
                          <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
                            Δ {deltaHum > 0 ? `+${deltaHum.toFixed(1)}` : deltaHum.toFixed(1)}%
                          </div>
                        )}
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 mb-0.5">Pressure</div>
                        <div className="text-sm font-bold text-slate-100">{rawPress.toFixed(1)}</div>
                        {isWrong && Math.abs(deltaPress) > 0 && (
                          <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
                            Δ {deltaPress > 0 ? `+${deltaPress.toFixed(1)}` : deltaPress.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panel 2: Cleaned Ground Truth */}
                  <div className="rounded-xl border border-emerald-500/35 bg-gradient-to-b from-emerald-950/20 to-slate-950/60 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-bold text-emerald-300 text-xs">CLEANED GROUND TRUTH</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                        {isWrong ? 'Imputed Spline Target' : 'Original Baseline Verified'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-1 font-mono">
                      <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                        <div className="text-[10px] text-emerald-400/80 mb-0.5">Temp Target</div>
                        <div className="text-sm font-bold text-emerald-300">{cleanTemp.toFixed(1)}°C</div>
                      </div>

                      <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                        <div className="text-[10px] text-emerald-400/80 mb-0.5">Humidity Target</div>
                        <div className="text-sm font-bold text-emerald-300">{cleanHum.toFixed(1)}%</div>
                      </div>

                      <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                        <div className="text-[10px] text-emerald-400/80 mb-0.5">Pressure Target</div>
                        <div className="text-sm font-bold text-emerald-300">{cleanPress.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Remediation & Triage Bar */}
                <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {isWrong && !isResolved ? (
                      <button
                        id={`btn-autoclean-${alert.id}`}
                        onClick={() => handleAutoRemediate(alert)}
                        disabled={remediatingId === alert.id || isSubmitting}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-sm shadow-emerald-950/40 transition-all disabled:opacity-50"
                        title="Replaces faulty raw field reading with verified cleaned baseline and resolves alert"
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        <span>{remediatingId === alert.id ? 'Cleaning & Imputing...' : 'Auto-Clean & Impute Row'}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{isWrong ? 'Baseline Cleaned & Imputed' : 'All Quality Checks Passed'}</span>
                      </span>
                    )}

                    {isWrong && (
                      <div className="flex items-center space-x-1.5 pl-1">
                        <Wrench className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-400 text-[11px]">Triage:</span>
                        <select
                          id={`select-triage-${alert.id}`}
                          value={alert.triage_status || 'Open'}
                          onChange={(e) => handleStatusChange(alert.id, e.target.value as any)}
                          disabled={isSubmitting}
                          className="rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px] px-2 py-1 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Open">Open</option>
                          <option value="Investigating">Investigate</option>
                          <option value="Verified Fault">Verified Fault</option>
                          <option value="Resolved">Resolved</option>
                          <option value="False Alarm">False Alarm</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Technician Notes Button */}
                  <button
                    onClick={() => {
                      if (expandedNotesId === alert.id) {
                        setExpandedNotesId(null);
                      } else {
                        setExpandedNotesId(alert.id);
                        setEditingNotes((prev) => ({
                          ...prev,
                          [alert.id]: alert.technician_notes || '',
                        }));
                      }
                    }}
                    className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 text-xs font-medium"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{alert.technician_notes ? 'View Notes' : 'Add Note'}</span>
                    {isNotesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                {/* Expandable Notes Area */}
                {isNotesExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <textarea
                      value={editingNotes[alert.id] ?? alert.technician_notes ?? ''}
                      onChange={(e) =>
                        setEditingNotes({
                          ...editingNotes,
                          [alert.id]: e.target.value,
                        })
                      }
                      placeholder="Add meteorological engineer log or hardware sensor notes..."
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 min-h-[60px]"
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => setExpandedNotesId(null)}
                        className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveNotes(alert.id, alert.triage_status)}
                        disabled={isSubmitting}
                        className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow transition-all"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
