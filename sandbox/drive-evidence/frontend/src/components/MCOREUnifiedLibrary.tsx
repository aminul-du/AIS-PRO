import React, { useState } from 'react';
import { Network, BarChart3, Bot, LayoutTemplate, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const MCOREUnifiedLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'topology' | 'traffic' | 'tutor'>('topology');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('/api/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: 3 }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error("MTE Query Error:", err);
      setResponse({ answer: "Error contacting Memory Trust Engine." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <LayoutTemplate className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            MCORE Unified Library
          </h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('topology')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'topology' ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Topology</span>
          </button>
          <button
            onClick={() => setActiveTab('traffic')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'traffic' ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Traffic</span>
          </button>
          <button
            onClick={() => setActiveTab('tutor')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'tutor' ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Tutor (MTE)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative bg-slate-900 p-6 overflow-hidden">
        {activeTab === 'topology' && (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50">
            <Network className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-300">Interactive Topology Map</h3>
            <p className="text-slate-500 mt-2">Cytoscape.js integration pending...</p>
          </div>
        )}

        {activeTab === 'traffic' && (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50">
            <BarChart3 className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-300">Network Traffic Mix</h3>
            <p className="text-slate-500 mt-2">ECharts rendering pending...</p>
          </div>
        )}

        {activeTab === 'tutor' && (
          <div className="h-full flex flex-col space-y-4">
            <div className="flex-1 overflow-y-auto border border-slate-700 rounded-xl p-4 bg-slate-800/50 space-y-4">
              {response ? (
                <div className="space-y-4">
                  <div className="bg-slate-700 p-4 rounded-lg text-sm text-slate-200">
                    <span className="font-bold text-blue-400">You:</span> {query}
                  </div>
                  <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-sm text-slate-200">
                    <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-blue-500/20">
                      <Bot className="w-5 h-5 text-blue-400" />
                      <span className="font-bold text-blue-400">Memory Trust Engine</span>
                      {response.evidence_bundle && (
                         <span className="ml-auto flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                           <CheckCircle2 className="w-3 h-3" />
                           <span>Bundle ID: {response.session_id}</span>
                         </span>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap">{response.answer}</div>

                    {response.retrieval_hits && response.retrieval_hits.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-500/20">
                        <p className="text-xs text-slate-400 font-mono mb-2 flex items-center"><ShieldAlert className="w-3 h-3 mr-1"/> Trust Context Sourced From:</p>
                        <ul className="space-y-1">
                          {response.retrieval_hits.map((hit: any, i: number) => (
                            <li key={i} className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300 flex justify-between">
                               <span>{hit.source}</span>
                               <span className="text-emerald-400 font-mono">{hit.trust_class}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <Bot className="w-16 h-16 text-slate-700 mb-4" />
                  <p>Ask a question. Your query will be routed through the Refusal-First Memory Trust Engine.</p>
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Ask the AI Tutor (e.g. 'What is the PMICS framework?')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                disabled={loading}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white transition-colors disabled:opacity-50"
                onClick={handleQuery}
                disabled={loading || !query.trim()}
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MCOREUnifiedLibrary;
