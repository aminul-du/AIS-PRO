import React, { useState, useEffect } from 'react';
import { Save, Check, FileText, Code2 } from 'lucide-react';
import { FileData } from '../types';

interface DocViewerProps {
  filePath: string | null;
  onClose?: () => void;
  onSaved?: () => void;
}

export const DocViewer: React.FC<DocViewerProps> = ({ filePath, onSaved }) => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [parsedDoc, setParsedDoc] = useState<any | null>(null);

  useEffect(() => {
    if (!filePath) {
      setFileData(null);
      setContent('');
      setParsedDoc(null);
      return;
    }

    const loadFile = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/drive/file?path=${encodeURIComponent(filePath)}`);
        const data: FileData = await res.json();
        setFileData(data);
        setContent(data.content);

        if (filePath.endsWith('.gdoc')) {
          try {
            setParsedDoc(JSON.parse(data.content));
          } catch {
            setParsedDoc(null);
          }
        } else {
          setParsedDoc(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [filePath]);

  const handleSave = async () => {
    if (!filePath) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await fetch('/api/drive/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onSaved?.();
    } catch {
      alert('Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  if (!filePath) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
        <FileText className="w-10 h-10 mx-auto text-slate-600" />
        <p className="text-sm font-medium text-slate-400">No document selected</p>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Select a file or Google Doc from the <strong>Drive Files</strong> tab to edit or preview here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* File Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            {filePath.endsWith('.gdoc') ? <FileText className="w-5 h-5" /> : <Code2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white truncate">{fileData?.name || filePath}</h3>
              {fileData?.is_binary && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Binary
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-slate-400">/{filePath}</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || isLoading || fileData?.is_binary}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
        >
          {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading document...</div>
      ) : (
        <div className="space-y-4">
          {/* Structured GDoc Preview if applicable */}
          {parsedDoc && (
            <div className="bg-slate-950/70 border border-blue-900/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-400 font-mono">
                  Google Doc Formatted View
                </span>
                {parsedDoc.last_synced && (
                  <span className="text-[10px] text-slate-500 font-mono">Synced: {parsedDoc.last_synced}</span>
                )}
              </div>

              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">{parsedDoc.title}</h1>
                {parsedDoc.author && <p className="text-xs text-slate-400 mt-0.5">{parsedDoc.author}</p>}
                {parsedDoc.course && <p className="text-xs text-blue-400/90 font-mono mt-0.5">{parsedDoc.course}</p>}
              </div>

              {parsedDoc.abstract && (
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed italic">
                  "{parsedDoc.abstract}"
                </div>
              )}

              {Array.isArray(parsedDoc.sections) && (
                <div className="space-y-3 pt-2">
                  {parsedDoc.sections.map((s: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <h4 className="text-xs font-semibold text-slate-200">{s.heading}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{s.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Raw Editor / Content Box */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              {parsedDoc ? 'Raw JSON Content' : 'File Editor'}
            </label>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (filePath.endsWith('.gdoc')) {
                  try {
                    setParsedDoc(JSON.parse(e.target.value));
                  } catch {
                    // Ignore transient JSON parse errors while user is editing
                  }
                }
              }}
              disabled={fileData?.is_binary}
              rows={16}
              className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};
