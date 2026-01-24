import React, { useState } from 'react';
import axios from 'axios';

const styles = {
  card: "bg-emerald-900/10 border-2 border-dashed border-emerald-500/30 p-8 rounded-3xl text-center hover:border-emerald-500 transition-all group cursor-pointer",
  icon: "text-4xl mb-3 group-hover:scale-110 transition-transform",
  title: "text-white font-bold uppercase tracking-widest text-sm",
  subtitle: "text-[10px] text-slate-500 mt-2",
};

export const ExcelExporter: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/inventory/export', {
        responseType: 'blob', // Nutné pro binární data
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sklad_export_${new Date().toLocaleDateString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Chyba při exportu dat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card} onClick={handleExport}>
      <div className={styles.icon}>{loading ? "⏳" : "📥"}</div>
      <h4 className={styles.title}>
        {loading ? 'Generuji soubor...' : 'Exportovat aktuální stav'}
      </h4>
      <p className={styles.subtitle}>
        Stáhne kompletní seznam položek ve formátu .xlsx
      </p>
    </div>
  );
};