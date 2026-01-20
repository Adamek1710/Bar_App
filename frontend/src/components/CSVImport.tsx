import React, { useState } from 'react';

const styles = {
  //dropzone Container
  dropzone: "bg-slate-800/30 border-2 border-dashed border-slate-700 p-8 rounded-3xl text-center hover:border-blue-500 transition-all group",
  
  //  Visuals
  icon: "text-4xl mb-3 group-hover:scale-110 transition-transform italic",
  title: "text-white font-bold uppercase tracking-widest text-sm",
  subtitle: "text-[10px] text-slate-500 mt-2",
  
  // Hidden input
  hiddenInput: "hidden"
};

interface Props {
  onImport: (data: any[]) => Promise<void>;
}

export const CSVImporter: React.FC<Props> = ({ onImport }) => {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const items = [];

      //CSV parsing logic
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns.length < 5) continue;

        const name = columns[0].trim();
        const stock = parseFloat(columns[1]); // Column "Začátek"
        const price = parseFloat(columns[4]); // Column "Cena"

        if (name && !isNaN(price)) {
          items.push({
            name,
            unit_type: 'litry',
            current_stock: isNaN(stock) ? 0 : stock,
            selling_price: price
          });
        }
      }

      try {
        await onImport(items);
        alert(`Úspěšně naimportováno ${items.length} položek.`);
      } catch (err) {
        alert("Chyba při importu. Některé položky už možná existují.");
      } finally {
        setLoading(false);
        e.target.value = ''; // Input reset
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className={styles.dropzone}>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className={styles.hiddenInput}
        id="csv-upload"
        disabled={loading}
      />
      
      <label htmlFor="csv-upload" className="cursor-pointer">
        <div className={styles.icon}>📊</div>
        
        <h4 className={styles.title}>
          {loading ? 'Probíhá import...' : 'Importovat sklad z CSV'}
        </h4>
        
        <p className={styles.subtitle}>
          Klikni pro výběr souboru (formát: Název, Začátek, ..., Cena)
        </p>
      </label>
    </div>
  );
};