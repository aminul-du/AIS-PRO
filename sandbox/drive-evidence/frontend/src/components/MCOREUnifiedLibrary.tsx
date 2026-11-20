import React, { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Network, BarChart3, Bot, LayoutTemplate, Send, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import * as THREE from 'three';
import cytoscape from 'cytoscape';
import * as echarts from 'echarts';

// ==============================================================================
// 1. Error Boundary
// ==============================================================================
interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("MCORE Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-900 border border-red-500/30 rounded-xl text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mb-3" />
          <h4 className="text-lg font-bold text-slate-200">{this.props.fallbackTitle || "Visualization Notice"}</h4>
          <p className="text-xs text-slate-400 mt-2 max-w-md">
            {this.state.error?.message || "Component encountered a rendering interruption. All core data remains secure."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Component</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==============================================================================
// 2. Native Three.js 3D MCORE Core Component
// ==============================================================================
const NativeThreeCore: React.FC<{ isPulsing: boolean }> = ({ isPulsing }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPulsingRef = useRef(isPulsing);

  useEffect(() => {
    isPulsingRef.current = isPulsing;
  }, [isPulsing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 400;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn("WebGL not available, falling back:", e);
      return;
    }

    // Geometry & Material
    const geometry = new THREE.IcosahedronGeometry(1.8, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      wireframe: true,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Inner glowing core
    const innerGeo = new THREE.IcosahedronGeometry(0.9, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Drag rotation controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      mesh.rotation.y += deltaX * 0.01;
      mesh.rotation.x += deltaY * 0.01;
      innerMesh.rotation.y -= deltaX * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.style.cursor = "grab";
    domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Animation Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (!isDragging) {
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.008;
        innerMesh.rotation.x -= 0.008;
        innerMesh.rotation.y -= 0.01;
      }

      // Reactive pulse
      if (isPulsingRef.current) {
        material.color.setHex(0x10b981);
        material.emissive.setHex(0x059669);
        const scale = 1.0 + Math.sin(elapsedTime * 6) * 0.08;
        mesh.scale.set(scale, scale, scale);
      } else {
        material.color.setHex(0x3b82f6);
        material.emissive.setHex(0x1d4ed8);
        mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 300;
      const h = container.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Teardown
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      geometry.dispose();
      material.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full relative" />;
};

// ==============================================================================
// 3. Native Cytoscape Topology Component
// ==============================================================================
const NativeCytoscapeTopology: React.FC = () => {
  const cyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cytoscape({
      container: cyRef.current,
      elements: [
        { data: { id: 'igw', label: 'IGW Core\n(Gateway)' }, classes: 'core' },
        { data: { id: 'gcp', label: 'GCP Edge\n(asia-east1)' }, classes: 'edge' },
        { data: { id: 'telco1', label: 'TELCO-A\n(Primary)' }, classes: 'telco' },
        { data: { id: 'telco2', label: 'TELCO-B\n(Failover)' }, classes: 'telco-alert' },
        { data: { id: 'edge-mcore', label: 'MCore Fabric\n(Debian 13)' }, classes: 'edge' },
        { data: { source: 'igw', target: 'gcp' } },
        { data: { source: 'igw', target: 'telco1' } },
        { data: { source: 'igw', target: 'telco2' } },
        { data: { source: 'gcp', target: 'edge-mcore' } },
      ],
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#f8fafc',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '11px',
            'font-family': 'monospace',
            'text-wrap': 'wrap',
            'width': '80px',
            'height': '80px',
            'border-width': 2,
            'border-color': '#475569',
          }
        },
        { selector: '.core', style: { 'background-color': '#2563eb', 'border-color': '#60a5fa' } },
        { selector: '.edge', style: { 'background-color': '#059669', 'border-color': '#34d399' } },
        { selector: '.telco', style: { 'background-color': '#0d9488', 'border-color': '#2dd4bf' } },
        { selector: '.telco-alert', style: { 'background-color': '#dc2626', 'border-color': '#f87171' } },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#475569',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        padding: 40,
      }
    });

    return () => {
      cy.destroy();
    };
  }, []);

  return <div ref={cyRef} className="w-full h-full" />;
};

// ==============================================================================
// 4. Native ECharts Traffic Component
// ==============================================================================
const NativeEChartsTraffic: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: '{b}: {c} GB ({d}%)'
      },
      legend: {
        bottom: '5%',
        left: 'center',
        textStyle: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
        itemGap: 16,
      },
      series: [
        {
          name: 'Traffic Mix',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#0f172a',
            borderWidth: 3,
          },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#f8fafc' }
          },
          data: [
            { value: 1048, name: 'Intl Data', itemStyle: { color: '#3b82f6' } },
            { value: 735, name: 'Domestic Data', itemStyle: { color: '#10b981' } },
            { value: 580, name: 'Voice Stream', itemStyle: { color: '#8b5cf6' } },
            { value: 484, name: 'Enterprise Cloud', itemStyle: { color: '#f59e0b' } },
            { value: 300, name: 'Sovereign IoT', itemStyle: { color: '#06b6d4' } },
          ]
        }
      ]
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, []);

  return <div ref={chartRef} className="w-full h-full" />;
};

// ==============================================================================
// 5. Main Unified Library Component
// ==============================================================================
export const MCOREUnifiedLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'topology' | 'traffic' | 'tutor'>('tutor');
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
      setResponse({ answer: "Error contacting Memory Trust Engine. Edge routing active." });
    } finally {
      setLoading(false);
      setTimeout(() => setIsPulsing(false), 2000);
    }
  };

  return (
    <ErrorBoundary fallbackTitle="MCORE Unified Library Interruption">
      <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
        {/* Header Tabs */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 gap-3">
          <div className="flex items-center space-x-3">
            <LayoutTemplate className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                MCORE Unified Library
              </h2>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                AI Systems Lab • MCORE-FDR-AIS-001
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('tutor')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'tutor'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>3D AI Tutor (MTE)</span>
            </button>
            <button
              onClick={() => setActiveTab('topology')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'topology'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              <Network className="w-4 h-4 text-emerald-400" />
              <span>Topology</span>
            </button>
            <button
              onClick={() => setActiveTab('traffic')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'traffic'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Traffic Mix</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative bg-slate-900 p-4 sm:p-6 overflow-hidden">
          {/* TAB 1: 3D AI Tutor */}
          {activeTab === 'tutor' && (
            <div className="h-full flex flex-col lg:flex-row gap-6">
              {/* 3D Canvas Box */}
              <div className="lg:w-1/3 h-64 lg:h-full border border-slate-700 rounded-xl bg-slate-950 overflow-hidden relative shadow-inner">
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-cyan-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-cyan-500/30 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    MCORE 3D Core Engine
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded">
                    Drag to rotate
                  </span>
                </div>
                <NativeThreeCore isPulsing={isPulsing} />
              </div>

              {/* Chat & Evidence Interface */}
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex-1 overflow-y-auto border border-slate-700 rounded-xl p-4 bg-slate-800/40 space-y-4 shadow-inner">
                  {response ? (
                    <div className="space-y-4">
                      <div className="bg-slate-700/80 p-3.5 rounded-lg text-sm text-slate-200 border border-slate-600">
                        <span className="font-bold text-blue-400">Query:</span> {query}
                      </div>
                      <div className="bg-blue-950/30 border border-blue-500/30 p-4 rounded-lg text-sm text-slate-200 space-y-3">
                        <div className="flex items-center space-x-2 pb-2 border-b border-blue-500/20">
                          <Bot className="w-5 h-5 text-blue-400" />
                          <span className="font-bold text-blue-400">Memory Trust Engine Response</span>
                          {response.session_id && (
                            <span className="ml-auto flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{response.session_id}</span>
                            </span>
                          )}
                        </div>
                        <div className="whitespace-pre-wrap leading-relaxed text-slate-200">{response.answer}</div>

                        {response.retrieval_hits && response.retrieval_hits.length > 0 && (
                          <div className="pt-3 border-t border-blue-500/20">
                            <p className="text-[11px] text-slate-400 font-mono mb-2 flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Anchored Memory Chunks (CONFIRMED):</span>
                            </p>
                            <ul className="space-y-1.5">
                              {response.retrieval_hits.map((hit: any, i: number) => (
                                <li key={i} className="text-[11px] bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-md text-slate-300 flex items-center justify-between font-mono">
                                  <span>{hit.source || hit.vector_id}</span>
                                  <span className="text-emerald-400 text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                                    {hit.trust_class || "CONFIRMED"}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
                        <Bot className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-semibold text-slate-300">Sovereign 3D AI Tutor Ready</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Submit a query to test refusal-first memory retrieval. The 3D core pulses green as verified evidence bundles are computed.
                      </p>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-md"
                    placeholder="Ask the AI Tutor (e.g. 'What is the PMICS predictive memory defense?')"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                    disabled={loading}
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors disabled:opacity-50 shadow-sm"
                    onClick={handleQuery}
                    disabled={loading || !query.trim()}
                    title="Send Query to MTE"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Topology */}
          {activeTab === 'topology' && (
            <div className="h-full w-full border border-slate-700 rounded-xl bg-slate-950/60 overflow-hidden relative shadow-inner">
              <div className="absolute top-3 left-3 z-10">
                <span className="text-[10px] font-mono text-emerald-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-emerald-500/30">
                  Cytoscape IGW / Telco Mesh Topology
                </span>
              </div>
              <NativeCytoscapeTopology />
            </div>
          )}

          {/* TAB 3: Traffic Mix */}
          {activeTab === 'traffic' && (
            <div className="h-full w-full border border-slate-700 rounded-xl bg-slate-950/60 overflow-hidden relative p-4 shadow-inner">
              <div className="absolute top-3 left-3 z-10">
                <span className="text-[10px] font-mono text-amber-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-amber-500/30">
                  ECharts Real-Time Traffic Distribution
                </span>
              </div>
              <NativeEChartsTraffic />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default MCOREUnifiedLibrary;
