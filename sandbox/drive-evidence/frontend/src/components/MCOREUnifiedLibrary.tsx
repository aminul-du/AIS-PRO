import React, { useState, useRef } from 'react';
import { Network, BarChart3, Bot, LayoutTemplate, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import CytoscapeComponent from 'react-cytoscapejs';
import ReactECharts from 'echarts-for-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// --- 3D AI Tutor Component ---
const MCORECore: React.FC<{ isPulsing: boolean }> = ({ isPulsing }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.5;
      
      if (isPulsing) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
        meshRef.current.scale.set(scale, scale, scale);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[2, 1]} />
      <meshStandardMaterial 
        color={isPulsing ? "#10b981" : "#3b82f6"} 
        wireframe={true}
        emissive={isPulsing ? "#059669" : "#1d4ed8"}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
};

export const MCOREUnifiedLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'topology' | 'traffic' | 'tutor'>('topology');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    setIsPulsing(true);
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
      setTimeout(() => setIsPulsing(false), 2000);
    }
  };

  // --- Cytoscape Topology Data ---
  const cyElements = [
    { data: { id: 'igw', label: 'IGW Core' }, classes: 'core' },
    { data: { id: 'cloud', label: 'GCP Edge' }, classes: 'edge' },
    { data: { id: 'telco1', label: 'TELCO A' }, classes: 'telco' },
    { data: { id: 'telco2', label: 'TELCO B' }, classes: 'telco-alert' },
    { data: { source: 'igw', target: 'cloud' } },
    { data: { source: 'igw', target: 'telco1' } },
    { data: { source: 'igw', target: 'telco2' } },
  ];

  const cyStylesheet = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '12px',
        'width': '60px',
        'height': '60px',
      }
    },
    { selector: '.core', style: { 'background-color': '#3b82f6' } },
    { selector: '.edge', style: { 'background-color': '#10b981' } },
    { selector: '.telco', style: { 'background-color': '#10b981' } },
    { selector: '.telco-alert', style: { 'background-color': '#ef4444' } },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#475569',
        'target-arrow-color': '#475569',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
  ];

  // --- ECharts Traffic Data ---
  const trafficOptions = {
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center', textStyle: { color: '#cbd5e1' } },
    series: [
      {
        name: 'Traffic Mix',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#0f172a',
          borderWidth: 2
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold', color: '#fff' }
        },
        labelLine: { show: false },
        data: [
          { value: 1048, name: 'Intl Data', itemStyle: { color: '#3b82f6' } },
          { value: 735, name: 'Domestic', itemStyle: { color: '#10b981' } },
          { value: 580, name: 'Voice', itemStyle: { color: '#8b5cf6' } },
          { value: 484, name: 'Enterprise', itemStyle: { color: '#f59e0b' } },
          { value: 300, name: 'IoT', itemStyle: { color: '#06b6d4' } }
        ]
      }
    ]
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
          <div className="h-full w-full border border-slate-700 rounded-xl bg-slate-800/50 overflow-hidden">
            <CytoscapeComponent 
              elements={cyElements} 
              stylesheet={cyStylesheet as any}
              style={{ width: '100%', height: '100%' }} 
              layout={{ name: 'cose', padding: 50 }}
            />
          </div>
        )}
        
        {activeTab === 'traffic' && (
          <div className="h-full w-full flex items-center justify-center border border-slate-700 rounded-xl bg-slate-800/50">
            <ReactECharts option={trafficOptions} style={{ height: '100%', width: '100%' }} />
          </div>
        )}

        {activeTab === 'tutor' && (
          <div className="h-full flex flex-col lg:flex-row gap-6">
            {/* 3D Canvas */}
            <div className="lg:w-1/3 h-64 lg:h-full border border-slate-700 rounded-xl bg-slate-950 overflow-hidden relative">
              <div className="absolute top-4 left-4 z-10">
                <span className="text-xs font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                  MCORE Core Engine
                </span>
              </div>
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <MCORECore isPulsing={isPulsing} />
                <OrbitControls enableZoom={false} autoRotate={!isPulsing} autoRotateSpeed={2} />
              </Canvas>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col space-y-4">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default MCOREUnifiedLibrary;