import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { authApi } from '@/lib/api';
import { BrainCircuit, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authApi.login(email, password);
      localStorage.setItem('cb_token', response.data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciais inválidas. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Head>
        <title>LOGIN | CREATIVE BRAIN</title>
      </Head>

      <div className="login-box glass">
        <div className="login-header">
          <div className="logo-glow">
            <BrainCircuit size={48} color="var(--accent)" />
          </div>
          <h1>CREATIVE BRAIN</h1>
          <p>Intelligence Platform // Calie Marketing</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message pulse">{error}</div>}
          
          <div className="input-group">
            <label>EMAIL</label>
            <div className="input-wrapper">
              <Mail size={18} />
              <input 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>SENHA</label>
            <div className="input-wrapper">
              <Lock size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>ENTRAR <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="login-footer">
          <span>&copy; 2024 NÓS AUTOMAÇÃO</span>
          <div className="status-dot">SYSTEM ONLINE</div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #1a1d21 0%, #0a0b0d 100%);
          padding: 20px;
        }

        .login-box {
          width: 100%;
          max-width: 420px;
          padding: 60px 40px;
          text-align: center;
          position: relative;
        }

        .login-header {
          margin-bottom: 40px;
        }

        .logo-glow {
          display: inline-block;
          margin-bottom: 24px;
          filter: drop-shadow(0 0 15px var(--accent-glow));
        }

        h1 {
          font-size: 24px;
          letter-spacing: 0.2em;
          margin-bottom: 8px;
        }

        p {
          font-size: 11px;
          color: var(--foreground-muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
          text-align: left;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 10px;
          font-weight: 700;
          color: var(--foreground-muted);
          letter-spacing: 0.1em;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          transition: all 0.2s var(--easing);
        }

        .input-wrapper:focus-within {
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 15px var(--accent-glow);
        }

        input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          width: 100%;
          font-size: 14px;
        }

        .error-message {
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          border-radius: var(--radius-sm);
          color: #ef4444;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
        }

        .login-btn {
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 12px;
        }

        .login-footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9px;
          color: var(--foreground-muted);
          letter-spacing: 0.1em;
        }

        .status-dot {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-dot::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #10B981;
          border-radius: 50%;
          box-shadow: 0 0 5px #10B981;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
