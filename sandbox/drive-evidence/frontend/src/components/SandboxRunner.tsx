import React, { useState } from 'react';
import { Play, Terminal, Clock, CheckCircle2, XCircle, Code, RotateCcw } from 'lucide-react';
import { SandboxResult } from '../types';

const TEMPLATES = [
  {
    name: '1. Scan Drive Structure',
    code: `import os
from pathlib import Path

drive = os.environ.get("DRIVE_PATH", "/content/drive")
print(f"=== [sboxdrive-gdocs] Scanning storage at {drive} ===")

root = Path(drive)
if root.exists():
    for idx, item in enumerate(root.iterdir()):
        kind = "DIR " if item.is_dir() else "FILE"
        size = item.stat().st_size if not item.is_dir() else "-"
        print(f"[{idx+1}] {kind} | {item.name:<32} | {size} bytes")
else:
    print(f"Drive path {drive} does not exist.")
`,
  },
  {
    name: '2. Parse University Proposal (.gdoc)',
    code: `import os, json
from pathlib import Path

drive = Path(os.environ.get("DRIVE_PATH", "/content/drive"))
gdoc_file = drive / "University_Research_Proposal.gdoc"

if gdoc_file.exists():
    data = json.loads(gdoc_file.read_text(encoding="utf-8"))
    print("=== UNIVERSITY RESEARCH PROPOSAL ===")
    print(f"Title   : {data.get('title')}")
    print(f"Author  : {data.get('author')}")
    print(f"Course  : {data.get('course')}")
    print(f"Abstract: {data.get('abstract')}\\n")
    print("Sections:")
    for s in data.get("sections", []):
        print(f" * {s.get('heading')}: {s.get('body')}")
else:
    print(f"Proposal file not found at {gdoc_file}. Seed sample docs first!")
`,
  },
  {
    name: '3. Analyze CSV Telemetry',
    code: `import os, csv
from pathlib import Path

drive = Path(os.environ.get("DRIVE_PATH", "/content/drive"))
csv_file = drive / "experiment_telemetry.csv"

if csv_file.exists():
    with open(csv_file, "r") as f:
        reader = list(csv.DictReader(f))
    print(f"=== EXPERIMENT TELEMETRY ({len(reader)} EPOCHS) ===")
    for row in reader:
        print(f"Epoch {row['epoch']} -> Acc: {row['accuracy']} | Loss: {row['loss']} | Throughput: {row['drive_throughput_mbps']} MB/s")
else:
    print("experiment_telemetry.csv not found.")
`,
  },
];

export const SandboxRunner: React.FC = () => {
  const [code, setCode] = useState(TEMPLATES[0].code);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SandboxResult | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/sandbox/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, timeout_seconds: 25 }),
      });
      const data: SandboxResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResult({
        success: false,
        stdout: '',
        stderr: 'Network request error: ' + msg,
        exit_code: 1,
        duration_seconds: 0,
        script_id: 'err',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sandbox Controller Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">sboxdrive-gdocs Python 3.14 Sandbox</h3>
              <p className="text-xs text-slate-400">
                Executes in an isolated subprocess with injected <code className="text-blue-300 font-mono">DRIVE_PATH</code>.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Executing...' : 'Run in Sandbox'}
            </button>
          </div>
        </div>

        {/* Template Quick Selection */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500 mr-1 flex items-center gap-1">
            <Code className="w-3 h-3" /> Quick Snippets:
          </span>
          {TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              onClick={() => setCode(tmpl.code)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              {tmpl.name}
            </button>
          ))}
        </div>

        {/* Code Editor */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Python 3.14 Code Input
            </label>
            <button
              onClick={() => setCode('')}
              className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
            placeholder="# Write Python code to interact with DRIVE_PATH..."
            spellCheck={false}
          />
        </div>
      </div>

      {/* Terminal Output */}
      {result && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Output Header */}
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-300 ml-2">Console Output (Run: {result.script_id})</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {result.duration_seconds}s
              </span>

              {result.success ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Exit: 0
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-400">
                  <XCircle className="w-3.5 h-3.5" />
                  Exit: {result.exit_code}
                </span>
              )}
            </div>
          </div>

          {/* Output Body */}
          <div className="p-4 font-mono text-xs space-y-2 overflow-x-auto max-h-96">
            {result.stdout ? (
              <pre className="text-emerald-400/90 whitespace-pre-wrap leading-relaxed">{result.stdout}</pre>
            ) : null}

            {result.stderr ? (
              <pre className="text-rose-400/90 whitespace-pre-wrap leading-relaxed border-t border-rose-950/60 pt-2">
                {result.stderr}
              </pre>
            ) : null}

            {!result.stdout && !result.stderr && (
              <p className="text-slate-600 italic">No output produced.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
