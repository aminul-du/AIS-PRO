import React, { useState } from 'react';
import { Play, Sparkles, FolderSync, ShieldCheck, Cpu } from 'lucide-react';
import { SystemStatus } from '../types';

interface ColabMountCardProps {
  status: SystemStatus | null;
  onMountSuccess: () => void;
}

export const ColabMountCard: React.FC<ColabMountCardProps> = ({ status, onMountSuccess }) => {
  const [mountPath, setMountPath] = useState('/content/drive');
  const [isMounting, setIsMounting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [mountFeedback, setMountFeedback] = useState<string | null>(null);

  const handleMount = async () => {
    setIsMounting(true);
    setMountFeedback(null);
    try {
      const res = await fetch('/api/colab/mount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mount_path: mountPath }),
      });
      const data = await res.json();
      if (data.success) {
        setMountFeedback('Successfully mounted ' + mountPath);
      } else {
        setMountFeedback(
          data.error || (data.stderr ? data.stderr.trim() : 'Mount command failed. Local sandbox fallback is active.')
        );
      }
      onMountSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMountFeedback('Network error: ' + msg);
    } finally {
      setIsMounting(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await fetch('/api/sample/seed', { method: 'POST' });
      setMountFeedback('Sample University Docs, Notes, and CSV telemetry seeded!');
      onMountSuccess();
    } catch {
      setMountFeedback('Failed to seed sample files.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderSync className="w-5 h-5 text-blue-400" />
              Colab Drive Mount Controller
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              sboxdrive-gdocs
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Executes <code className="text-blue-300 font-mono">colab drivemount /content/drive</code> to connect Google Drive to the sandbox runtime.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 px-3 py-1.5">
            <span className="text-xs text-slate-500 font-mono mr-2">Target:</span>
            <input
              type="text"
              value={mountPath}
              onChange={(e) => setMountPath(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-mono focus:outline-none w-36"
              placeholder="/content/drive"
            />
          </div>

          <button
            onClick={handleMount}
            disabled={isMounting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isMounting ? 'animate-pulse' : ''}`} />
            {isMounting ? 'Mounting...' : 'Mount Drive'}
          </button>

          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            title="Seed university sample proposal and dataset"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Seed Sample Docs
          </button>
        </div>
      </div>

      {/* Mount status metadata chips */}
      {status && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
            <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Colab CLI Tool</span>
              <span className="font-mono text-slate-200 truncate block">
                {status.mount.colab_cli_installed ? 'Installed (~/.local/bin/colab)' : 'Not Found'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Active Drive Path</span>
              <span className="font-mono text-slate-200 truncate block" title={status.mount.active_drive_path}>
                {status.mount.active_drive_path}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
            <FolderSync className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Storage Mode</span>
              <span className="font-mono text-slate-200 block">
                {status.mount.is_mounted ? 'Mounted /content/drive' : 'Local Sandbox Mock/Fallback'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Feedback banner */}
      {mountFeedback && (
        <div className="mt-3 p-2.5 rounded-xl text-xs bg-slate-800/60 border border-slate-700 text-slate-300 font-mono">
          ℹ️ {mountFeedback}
        </div>
      )}
    </div>
  );
};
