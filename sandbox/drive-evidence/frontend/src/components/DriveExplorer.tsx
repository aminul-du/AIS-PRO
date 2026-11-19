import React, { useState } from 'react';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  Trash2,
  ExternalLink,
  Plus,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { DriveListing, DriveItem } from '../types';

interface DriveExplorerProps {
  listing: DriveListing | null;
  onNavigate: (path: string) => void;
  onOpenFile: (path: string) => void;
  onRefresh: () => void;
}

export const DriveExplorer: React.FC<DriveExplorerProps> = ({
  listing,
  onNavigate,
  onOpenFile,
  onRefresh,
}) => {
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const getFileIcon = (item: DriveItem) => {
    if (item.is_dir) return <Folder className="w-5 h-5 text-blue-400" />;
    if (item.is_gdoc) return <FileText className="w-5 h-5 text-blue-500 fill-blue-500/10" />;
    if (item.extension === '.csv') return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (['.py', '.ts', '.js', '.json'].includes(item.extension)) {
      return <FileCode className="w-5 h-5 text-amber-400" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const fullPath = listing?.current_path
      ? `${listing.current_path}/${newFileName.trim()}`
      : newFileName.trim();

    try {
      await fetch('/api/drive/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: fullPath,
          content: fullPath.endsWith('.gdoc')
            ? JSON.stringify({ title: newFileName, sections: [] }, null, 2)
            : `# ${newFileName}\n`,
        }),
      });
      setNewFileName('');
      setShowNewFile(false);
      onRefresh();
    } catch {
      alert('Failed to create file');
    }
  };

  const handleDelete = async (item: DriveItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;

    setIsDeleting(item.path);
    try {
      await fetch(`/api/drive/file?path=${encodeURIComponent(item.path)}`, {
        method: 'DELETE',
      });
      onRefresh();
    } catch {
      alert('Failed to delete file');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBack = () => {
    if (!listing?.current_path) return;
    const parts = listing.current_path.split('/');
    parts.pop();
    onNavigate(parts.join('/'));
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header and path breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {listing?.current_path ? (
            <button
              onClick={handleBack}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Go back up"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : null}
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-400" />
              Drive Explorer
            </h3>
            <span className="text-xs font-mono text-slate-400">
              /{listing?.current_path || ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFile(!showNewFile)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            New File / Doc
          </button>
        </div>
      </div>

      {/* New File Inline Form */}
      {showNewFile && (
        <form onSubmit={handleCreateFile} className="flex gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g. analysis.py, Notes.md, or Research.gdoc"
            className="bg-transparent text-xs text-slate-200 placeholder:text-slate-500 flex-1 px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500 font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-all shadow-sm"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowNewFile(false)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-all"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Items list */}
      <div className="divide-y divide-slate-800/80 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/40">
        {!listing || listing.items.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No files found in this directory. Click "Seed Sample Docs" above to add starter files.
          </div>
        ) : (
          listing.items.map((item) => (
            <div
              key={item.path}
              onClick={() => (item.is_dir ? onNavigate(item.path) : onOpenFile(item.path))}
              className="flex items-center justify-between p-3.5 hover:bg-slate-800/40 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">{getFileIcon(item)}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                      {item.name}
                    </span>
                    {item.is_gdoc && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                        Google Doc
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>{item.is_dir ? 'Directory' : `${(item.size / 1024).toFixed(1)} KB`}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      {new Date(item.modified).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                {!item.is_dir && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFile(item.path);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Open in Editor"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(item, e)}
                  disabled={isDeleting === item.path}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
