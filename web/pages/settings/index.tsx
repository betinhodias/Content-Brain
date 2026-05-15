import React from 'react';
import Head from 'next/head';
import { 
  Settings as SettingsIcon, 
  Key, 
  Shield, 
  Database, 
  User,
  CreditCard,
  Bell
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <Head>
        <title>SETTINGS | CREATIVE BRAIN</title>
      </Head>

      <div className="settings-grid">
        <aside className="settings-nav glass">
          <div className="nav-group">
            <label>AGÊNCIA</label>
            <div className="nav-item active"><SettingsIcon size={18} /> Geral</div>
            <div className="nav-item"><Key size={18} /> Chaves de API</div>
            <div className="nav-item"><CreditCard size={18} /> Faturamento</div>
          </div>
          <div className="nav-group">
            <label>SISTEMA</label>
            <div className="nav-item"><Shield size={18} /> Segurança</div>
            <div className="nav-item"><Database size={18} /> Conectores</div>
            <div className="nav-item"><Bell size={18} /> Notificações</div>
          </div>
        </aside>

        <section className="settings-content glass">
          <div className="section-header">
            <h2>CONFIGURAÇÕES GERAIS</h2>
            <p>Gerencie as configurações globais e preferências da sua agência.</p>
          </div>

          <div className="settings-form">
            <div className="input-group">
              <label>NOME DA AGÊNCIA</label>
              <input type="text" defaultValue="Calie Marketing" />
            </div>

            <div className="input-group">
              <label>SLUG DA AGÊNCIA</label>
              <input type="text" defaultValue="calie-marketing" disabled />
              <small>Identificador usado para rotas internas e chamadas de API.</small>
            </div>

            <div className="input-group">
              <label>MOTOR DE IA PADRÃO (LLM)</label>
              <select defaultValue="gemma-4">
                <option value="gemma-4">Gemma 4 31b Free (Neural)</option>
                <option value="gpt-4o">GPT-4o (Standard)</option>
                <option value="claude-3-5">Claude 3.5 Sonnet</option>
              </select>
            </div>

            <hr className="divider" />

            <div className="danger-zone">
              <h3>ZONA DE PERIGO</h3>
              <p>Ações irreversíveis para a instância da sua agência.</p>
              <button className="btn-danger">DELETAR DADOS DA AGÊNCIA</button>
            </div>
          </div>

          <div className="section-footer">
            <button className="btn-primary">SALVAR ALTERAÇÕES</button>
          </div>
        </section>
      </div>

      <style jsx>{`
        .settings-page {
          max-width: 1200px;
          margin: 0 auto;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
          align-items: start;
        }

        .settings-nav {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .nav-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-group label {
          font-size: 10px;
          font-weight: 800;
          color: var(--foreground-muted);
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          padding-left: 12px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          color: var(--foreground-muted);
          cursor: pointer;
          transition: all 0.2s var(--easing);
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.03);
          color: white;
        }

        .nav-item.active {
          background: rgba(255, 92, 0, 0.1);
          color: var(--accent);
          box-shadow: inset 0 0 10px rgba(255, 92, 0, 0.05);
        }

        .settings-content {
          padding: 40px;
        }

        .section-header {
          margin-bottom: 40px;
        }

        .section-header h2 {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .section-header p {
          font-size: 14px;
          color: var(--foreground-muted);
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
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

        .input-group input, .input-group select {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s var(--easing);
        }

        .input-group input:focus {
          border-color: var(--accent);
        }

        .input-group small {
          font-size: 11px;
          color: var(--foreground-muted);
          font-style: italic;
        }

        .divider {
          border: none;
          border-bottom: 1px solid var(--border);
          margin: 16px 0;
        }

        .danger-zone {
          padding: 24px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.03);
          border-radius: var(--radius-md);
        }

        .danger-zone h3 {
          font-size: 14px;
          color: #EF4444;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .danger-zone p {
          font-size: 12px;
          color: var(--foreground-muted);
          margin-bottom: 16px;
        }

        .btn-danger {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
          border: 1px solid #EF4444;
          padding: 8px 16px;
          font-size: 11px;
          font-weight: 700;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-danger:hover {
          background: #EF4444;
          color: white;
        }

        .section-footer {
          margin-top: 40px;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
