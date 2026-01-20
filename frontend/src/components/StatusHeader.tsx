import React from 'react';

const styles = {
  header: "flex justify-between items-center mb-10 pb-6 border-b border-slate-800",
  
  // Logo section
  logoWrapper: "group cursor-default",
  logoText: "text-3xl font-black text-white italic tracking-tighter",
  logoAccent: "text-blue-500 group-hover:text-blue-400 transition-colors",
  version: "text-[10px] text-slate-500 font-bold uppercase tracking-widest",
  
  // Status badge
  badge: (isRunning: boolean) => `
    px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all
    ${isRunning 
      ? 'border-red-500 text-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
      : 'border-emerald-500 text-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}
  `
};

interface Props {
  isRunning: boolean;
}

export const StatusHeader: React.FC<Props> = ({ isRunning }) => (
  <header className={styles.header}>
    <div className={styles.logoWrapper}>
      <h1 className={styles.logoText}>
        BAR<span className={styles.logoAccent}>SYS</span>
      </h1>
      <p className={styles.version}>v1.0 stable</p>
    </div>

    <div className={styles.badge(isRunning)}>
      {isRunning ? '● Inventura probíhá' : 'Skladový režim'}
    </div>
  </header>
);