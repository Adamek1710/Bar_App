import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const styles = {
  wrapper: "min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4",
  card: "w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl",
  title: "text-3xl font-black text-center mb-8 text-blue-500",
  subtitle: "text-slate-500 text-center mb-8 text-sm",
  
  fieldWrapper: "flex flex-col gap-2 mb-6",
  label: "text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1",
  input: "w-full bg-slate-950 border-2 border-slate-800/50 p-4 rounded-2xl focus:border-blue-500 outline-none transition-all text-white placeholder:text-slate-700 font-bold",
  
  btn: "w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
  error: "bg-red-500/10 border border-red-500/50 p-4 rounded-2xl mb-6 text-red-400 text-sm text-center",
  
  roleInfo: "mt-8 p-4 bg-slate-800/50 rounded-2xl border border-slate-700",
  roleTitle: "text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2",
  roleList: "space-y-2 text-xs text-slate-500"
};

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>BAR_CONTROL</h1>
        <p className={styles.subtitle}>Přihlášení do systému</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.fieldWrapper}>
            <label className={styles.label}>Uživatelské jméno</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              placeholder="Zadejte uživatelské jméno"
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.fieldWrapper}>
            <label className={styles.label}>Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Zadejte heslo"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={styles.btn}
            disabled={isLoading || !username || !password}
          >
            {isLoading ? 'Přihlašování...' : 'Přihlásit se'}
          </button>
        </form>

        <div className={styles.roleInfo}>
          <div className={styles.roleTitle}>Výchozí účty</div>
          <div className={styles.roleList}>
            <div><strong>Owner:</strong> owner / owner123</div>
            <div><strong>Employee:</strong> employee / emp123</div>
          </div>
        </div>
      </div>
    </div>
  );
};
