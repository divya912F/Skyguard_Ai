import React, { useState } from 'react';
import { X, Terminal, Copy, Check, Play, Send } from 'lucide-react';

interface ApiExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiExplorerModal: React.FC<ApiExplorerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeEndpoint, setActiveEndpoint] = useState<string>('/alerts');
  const [responseJson, setResponseJson] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const endpoints = [
    { method: 'GET', path: '/alerts', desc: 'Summary metrics and active anomaly list' },
    { method: 'GET', path: '/stations', desc: 'Metadata for all 10 meteorological stations' },
    { method: 'GET', path: '/weather?limit=10', desc: 'Recent chronological sensor telemetry' },
    { method: 'GET', path: '/api/diurnal?location_id=0', desc: '24-hour diurnal cycle averages & anomalies' },
    { method: 'GET', path: '/api/seasonal?location_id=0', desc: '12-month climate matrix & sensor flatlines' },
    { method: 'GET', path: '/api/compare?stations=0,1,8', desc: 'Multi-station synoptic telemetry comparison' },
    { method: 'GET', path: '/api/tune-thresholds', desc: 'Current AI sensitivity and QC threshold values' },
    { method: 'POST', path: '/simulate-anomaly', desc: 'Injects controlled demo anomaly' },
    { method: 'GET', path: '/sensor-health', desc: 'Health index and fault statistics' },
    { method: 'GET', path: '/health', desc: 'Backend service liveness check' },
  ];

  const handleExecute = async () => {
    setIsLoading(true);
    try {
      const isPost = activeEndpoint === '/simulate-anomaly';
      const res = await fetch(activeEndpoint, {
        method: isPost ? 'POST' : 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      const data = await res.json();
      setResponseJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseJson(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const curl = `curl -X ${activeEndpoint === '/simulate-anomaly' ? 'POST' : 'GET'} "http://localhost:3000${activeEndpoint}" -H "Accept: application/json"`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="api-explorer-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div id="api-explorer-modal-content" className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">SkyGuard AI - REST API Explorer</h3>
            <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-xs font-mono text-cyan-400 border border-cyan-500/20">
              FastAPI Compatible
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-y-auto flex-1">
          {/* Endpoint List */}
          <div className="p-3 space-y-1 bg-slate-950/40">
            <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase tracking-wider block mb-2">
              Available Endpoints
            </span>
            {endpoints.map((ep) => {
              const isSelected = activeEndpoint === ep.path;
              return (
                <button
                  key={ep.path}
                  onClick={() => {
                    setActiveEndpoint(ep.path);
                    setResponseJson('');
                  }}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-all ${
                    isSelected
                      ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      ep.method === 'POST' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-[11px] truncate">{ep.path}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">{ep.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Execution & Output View */}
          <div className="md:col-span-2 p-4 flex flex-col justify-between bg-slate-900">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 font-mono text-xs text-slate-200">
                  <span className="text-cyan-400 font-bold">
                    {activeEndpoint === '/simulate-anomaly' ? 'POST' : 'GET'}
                  </span>
                  <span>{activeEndpoint}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied cURL' : 'cURL'}</span>
                  </button>

                  <button
                    onClick={handleExecute}
                    disabled={isLoading}
                    className="flex items-center space-x-1.5 rounded-lg bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    <span>{isLoading ? 'Running...' : 'Send Request'}</span>
                  </button>
                </div>
              </div>

              {/* JSON Output console */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 min-h-[260px] max-h-[380px] overflow-y-auto">
                {responseJson ? (
                  <pre className="whitespace-pre-wrap">{responseJson}</pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <Play className="h-6 w-6 mb-2 opacity-50" />
                    <span>Click "Send Request" to test this endpoint live against the SkyGuard AI engine.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>All endpoints support both root paths (e.g. <code>/alerts</code>) and <code>/api/*</code></span>
              <span className="font-mono text-cyan-400">HTTP 200 OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
