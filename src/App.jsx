import React, { useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';
import {
  Zap, Globe, Layout, ShieldCheck,
  Cpu, Command as CommandIcon, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { simulateAiAnalysis } from './services/AiService';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const App = () => {
  const [code, setCode] = useState(`// Professional Code Analysis\n\nfunction fastService() {\n  return "Optimized for speed";\n}`);
  const [analysisCache, setAnalysisCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('explain');

  const handleAnalyze = React.useCallback(async (mode = activeTab) => {
    if (!code.trim()) return;
    setActiveTab(mode);
    setLoading(true);
    try {
      const result = await simulateAiAnalysis(code, mode);
      setAnalysisCache(prev => ({
        ...prev,
        [mode]: result
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [code, activeTab]);

  // Оптимизированная подсветка
  const highlightCode = React.useCallback(code => {
    return highlight(code, languages.js);
  }, []);

  const currentAnalysis = analysisCache[activeTab];

  const tabs = [
    { id: 'explain', label: 'Объяснение', icon: Layout, color: 'text-indigo-400' },
    { id: 'bugs', label: 'Безопасность', icon: ShieldCheck, color: 'text-emerald-400' },
    { id: 'refactor', label: 'Оптимизация', icon: Cpu, color: 'text-amber-400' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] text-[#fafafa] selection:bg-indigo-500/30 overflow-x-hidden">

      {/* Universal Header */}
      <nav className="sticky top-0 z-[100] h-14 md:h-16 border-b border-white/[0.05] bg-[#09090b]/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
            <CommandIcon className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs md:text-sm font-bold tracking-tight uppercase truncate">CodeIntel</span>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest hidden xs:block">Enterprise</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-full">
            <Globe className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Global v2.5</span>
          </div>
          <div className="lg:hidden w-8 h-8 flex items-center justify-center text-zinc-500">
            <Layout className="w-5 h-5" />
          </div>
        </div>
      </nav>

      {/* Optimized Main Content Area - Max Width 2600px */}
      <main className="flex-1 max-w-[2600px] mx-auto w-full p-4 md:p-6 lg:p-10 gap-6 lg:gap-10 flex flex-col lg:flex-row">

        {/* Left Column (Editor) */}
        <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col gap-4 order-2 lg:order-1 animate-slide-up">
          <div className="flex flex-col gap-1 px-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Исходный код</h2>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Семантический движок ввода</p>
          </div>

          <div className="glass-container flex-1 flex flex-col overflow-hidden min-h-[400px] md:min-h-[600px]">
            <div className="p-3 md:p-4 bg-white/[0.02] border-t border-white/[0.08]">
              <button
                onClick={() => handleAnalyze()}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-lg font-bold text-[11px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20"
              >
                {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Анализирую...' : 'Запустить Интеллект'}
              </button>
            </div>
            <div className="h-10 border-b border-white/[0.08] flex items-center justify-between px-4 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Editor.v2</span>
            </div>

            <div className="flex-1 bg-[#050505] p-2 md:p-4 font-mono text-xs md:text-sm overflow-auto scroll-classic">
              <Editor
                value={code}
                onValueChange={setCode}
                highlight={highlightCode}
                padding={10}
                className="outline-none min-h-full"
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  lineHeight: '1.6',
                }}
              />
            </div>


          </div>
        </div>

        {/* Right Column (Results) */}
        <div className="w-full lg:flex-1 flex flex-col gap-4 order-1 lg:order-2 animate-slide-up [animation-delay:150ms]">

          <div className="flex overflow-x-auto scroll-none -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex bg-white/[0.02] p-1.5 rounded-xl border border-white/[0.05] w-full lg:w-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleAnalyze(tab.id)}
                  className={cn(
                    "flex-1 md:!p-4 md:flex-none px-4 md:px-10 py-3 rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-2",
                    activeTab === tab.id
                      ? "bg-white text-black shadow-xl"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-container flex-1 overflow-hidden min-h-[450px] flex flex-col relative bg-[#121215]/40 backdrop-blur-2xl">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-10 text-center"
                >
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Neural processing...</p>
                </motion.div>
              ) : currentAnalysis ? (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full md:!m-4"
                >
                  <div className="p-4 md:p-6 border-b border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl bg-white/5 shadow-inner", tabs.find(t => t.id === activeTab).color)}>
                        {React.createElement(tabs.find(t => t.id === activeTab).icon, { size: 20 })}
                      </div>
                      <div>
                        <h3 className="text-lg md:text-2xl font-bold tracking-tight">{currentAnalysis.title}</h3>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">AI Analysis Complete • Engine: {currentAnalysis.model}</p>
                      </div>
                    </div>
                    <div className="hidden xs:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Live Agent</span>
                    </div>
                  </div>

                  <div className="p-6 md:p-10 flex-1 overflow-auto scroll-classic markdown-content prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentAnalysis.content}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="relative mb-8">
                    <div className="w-28 h-28 rounded-3xl border border-white/[0.03] flex items-center justify-center bg-white/[0.01] rotate-12">
                      <Sparkles className="w-12 h-12 text-zinc-800 -rotate-12" />
                    </div>
                    <div className="absolute -inset-8 bg-indigo-500/10 blur-[80px] rounded-full"></div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 uppercase tracking-[0.2em] text-zinc-300">Neural Connect</h3>
                  <p className="text-zinc-500 text-xs md:text-sm max-w-[320px] leading-relaxed font-medium">Система в режиме ожидания. Вставьте код и выберите режим для активации нейросети.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Enterprise Footer */}
      <footer className="mt-auto px-6 md:px-12 py-12 border-t border-white/[0.03] bg-[#050505]">
        <div className="max-w-[2600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-8 text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em]">
              <span>© 2026 CodeIntel Global</span>
              <span className="hidden md:block">Privacy</span>
              <span className="hidden md:block">Status: 200 OK</span>
            </div>
            <p className="text-[9px] text-zinc-800 max-w-xs md:max-w-none">Advanced Neural Code Analysis Engine. Version 2.5.4-Stable.</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Global Matrix Health</span>
              <div className="flex gap-1.5">
                {[1, 1, 1, 1, 1, 1, 1, 1, 0].map((s, i) => (
                  <div key={i} className={cn("w-4 h-1 rounded-[1px]", s ? "bg-indigo-500/80" : "bg-zinc-800")} />
                ))}
              </div>
            </div>
            <div className="h-10 w-px bg-white/5"></div>
            <div className="text-right">
              <div className="text-xs font-black text-white uppercase tracking-widest">Active</div>
              <div className="text-[9px] font-bold text-zinc-600 uppercase">99.98% SLA Secure</div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
