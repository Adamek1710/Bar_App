import React, { useState } from 'react';
import ExcelJS from 'exceljs';

const styles = {
  dropzone: "bg-slate-800/30 border-2 border-dashed border-slate-700 p-8 rounded-3xl text-center hover:border-blue-500 transition-all group",
  icon: "text-4xl mb-3 group-hover:scale-110 transition-transform italic",
  title: "text-white font-bold uppercase tracking-widest text-sm",
  subtitle: "text-[10px] text-slate-500 mt-2",
  hiddenInput: "hidden"
};

interface Props {
  onImport: (data: any[]) => Promise<void>;
}

export const CSVImporter: React.FC<Props> = ({ onImport }) => {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    // ExcelJS pracuje nejlépe s ArrayBuffer
    reader.readAsArrayBuffer(file);

    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = new ExcelJS.Workbook();
        
        // Should get both .xlsx and .csv
        await workbook.xlsx.load(buffer);
        
        const worksheet = workbook.worksheets[0] || workbook.getWorksheet(1);
        if (!worksheet) {
          alert("V souboru nebyl nalezen žádný list.");
          setLoading(false);
          return;
        }
        const items: any[] = [];

        // ExcelJS indexuje řádky od 1. i=1 je hlavička, i=2 jsou data.
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Přeskočit hlavičku

          // row.values vrací pole, kde index 1 je sloupec A, index 2 sloupec B...
          // Pozor: vrací buď pole nebo objekt, proto raději přistupujeme přes getCell
          const nameValue = row.getCell(1).value;
          const name = nameValue ? String(nameValue).trim() : '';

          const stock = parseFloat(row.getCell(2).text);
          const price = parseFloat(row.getCell(5).text); // Sloupec E (5. v pořadí)

          if (name && !isNaN(price)) {
            items.push({
              name,
              unit_type: 'litry',
              current_stock: isNaN(stock) ? 0 : stock,
              selling_price: price
            });
          }
        });

        if (items.length > 0) {
          await onImport(items);
          alert(`Úspěšně naimportováno ${items.length} položek přes ExcelJS.`);
        } else {
          alert("V souboru nebyla nalezena žádná platná data.");
        }
      } catch (err) {
        console.error("ExcelJS Error:", err);
        alert("Chyba při zpracování souboru. Ujisti se, že jde o platný .xlsx soubor.");
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
  };

  return (
    <div className={styles.dropzone}>
      <input
        type="file"
        accept=".xlsx"
        onChange={handleFileUpload}
        className={styles.hiddenInput}
        id="csv-upload"
        disabled={loading}
      />
      
      <label htmlFor="csv-upload" className="cursor-pointer">
        <div className={styles.icon}>📁</div>
        <h4 className={styles.title}>
          {loading ? 'Zpracovávám...' : 'Importovat Excel (exceljs)'}
        </h4>
        <p className={styles.subtitle}>
          Vyber soubor .xlsx (Sloupce: A:Název, B:Začátek, E:Cena)
        </p>
      </label>
    </div>
  );
};