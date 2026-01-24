import React, { useState } from 'react';
import axios from 'axios';

const styles = {
  dropzone: "bg-slate-800/30 border-2 border-dashed border-slate-700 p-8 rounded-3xl text-center hover:border-blue-500 transition-all group",
  icon: "text-4xl mb-3 group-hover:scale-110 transition-transform italic",
  title: "text-white font-bold uppercase tracking-widest text-sm",
  subtitle: "text-[10px] text-slate-500 mt-2",
  hiddenInput: "hidden"
};

interface Props {
  onImport: () => Promise<void>;
}

export const CSVImporter: React.FC<Props> = ({ onImport }) => {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      // Odeslání souboru na backend (Python)
      await axios.post('/api/inventory/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert("Soubor nahrán a zpracován na serveru!");
      
      // Refreshneme data v hlavní tabulce
      await onImport();
      
    } catch (err) {
      console.error("Chyba při uploadu:", err);
      alert("Chyba při nahrávání souboru na server.");
    } finally {
      setLoading(false);
      // Reset inputu, aby šel nahrát stejný soubor znovu
      e.target.value = '';
    }
  };

  return (
    <div className={styles.dropzone}>
      <input
        type="file"
        id="file-upload"
        onChange={handleFileUpload}
        accept=".xlsx"
        className={styles.hiddenInput}
        disabled={loading}
      />
      <label htmlFor="file-upload" className="cursor-pointer block">
        <div className={styles.icon}>
          {loading ? "⏳" : "📊"}
        </div>
        <h4 className={styles.title}>
          {loading ? 'Zpracovávám na serveru...' : 'Importovat Excel (A:Název, B:Stav, E:Cena)'}
        </h4>
        <p className={styles.subtitle}>
          {loading ? 'Prosím čekejte, Python parsuje data...' : 'Klikněte pro výběr souboru .xlsx'}
        </p>
      </label>
    </div>
  );
};