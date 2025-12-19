import React from 'react';

interface Props {
  isRunning: boolean;
}

export const StatusHeader: React.FC<Props> = ({ isRunning }) => (
  <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-800">
    <div>
      <h1 className="text-3xl font-black text-white italic tracking-tighter">BAR<span className="text-blue-500">SYS</span></h1>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">v1.0 stable</p>
    </div>
    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-colors ${isRunning ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-emerald-500 text-emerald-500 bg-emerald-500/10'}`}>
      {isRunning ? '● Inventura probíhá' : 'Skladový režim'}
    </div>
  </header>
);