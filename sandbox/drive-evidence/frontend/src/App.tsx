import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ColabMountCard } from './components/ColabMountCard';
import { DriveExplorer } from './components/DriveExplorer';
import { DocViewer } from './components/DocViewer';
import { SandboxRunner } from './components/SandboxRunner';
import { MCOREUnifiedLibrary } from './components/MCOREUnifiedLibrary';
import { SystemStatus, DriveListing } from './types';

export const App: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [listing, setListing] = useState<DriveListing | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'explorer' | 'docs' | 'sandbox' | 'library'>('explorer');
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      const data: SystemStatus = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Status fetch error:', err);
    }
  }, []);

  const fetchFiles = useCallback(async (path: string = '') => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/drive/files?path=${encodeURIComponent(path)}`);
      const data: DriveListing = await res.json();
      setListing(data);
      setCurrentPath(path);
    } catch (err) {
      console.error('Files fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchStatus();
    fetchFiles(currentPath);
  }, [fetchStatus, fetchFiles, currentPath]);

  useEffect(() => {
    fetchStatus();
    fetchFiles('');
  }, [fetchStatus, fetchFiles]);

  const handleOpenFile = (path: string) => {
    setSelectedFile(path);
    setActiveTab('docs');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        status={status}
        activeTab={activeTab as any}
        setActiveTab={setActiveTab as any}
        onRefresh={refreshAll}
        isLoading={isLoading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Colab Mount Controller always visible for rapid control */}
        <ColabMountCard status={status} onMountSuccess={refreshAll} />

        {/* Tab Views */}
        {activeTab === 'explorer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DriveExplorer
                listing={listing}
                onNavigate={(p) => fetchFiles(p)}
                onOpenFile={handleOpenFile}
                onRefresh={refreshAll}
              />
            </div>
            <div className="lg:col-span-1">
              <DocViewer
                filePath={selectedFile || (listing?.items.find((i) => !i.is_dir)?.path ?? null)}
                onSaved={refreshAll}
              />
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="max-w-4xl mx-auto">
            <DocViewer filePath={selectedFile} onSaved={refreshAll} />
          </div>
        )}

        {activeTab === 'sandbox' && (
          <div className="max-w-4xl mx-auto">
            <SandboxRunner />
          </div>
        )}

        {activeTab === 'library' && (
          <div className="h-[600px] w-full">
            <MCOREUnifiedLibrary />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        <p>AIS-PRO Sovereign Architecture • Meticulous Core Ltd. (MCore) • MCORE-FDR-AIS-001</p>
      </footer>
    </div>
  );
};

export default App;
