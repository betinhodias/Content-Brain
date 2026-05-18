import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';

interface Client {
  id: string;
  name: string;
}

export default function NewPipelinePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    contentType: 'carousel',
    topic: '',
    tone: 'professional',
    additionalContext: '',
  });

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await api.get('/clients');
        setClients(response.data.data || []);
      } catch (err) {
        console.error('Failed to load clients', err);
      }
    }
    loadClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/pipelines/copy', formData);
      router.push(`/pipelines/${response.data.data.pipelineId}`);
    } catch (err) {
      alert('Erro ao criar pipeline: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-pipeline">
      <Head>
        <title>Novo Pipeline | Creative Brain</title>
      </Head>

      <div className="form-container glass">
        <div className="form-header">
          <h2>🧠 Iniciar Cérebro Criativo</h2>
          <div className="steps-indicator">
            <span className={step >= 1 ? 'active' : ''}>1</span>
            <div className="line" />
            <span className={step >= 2 ? 'active' : ''}>2</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <div className="form-step">
              <div className="input-group">
                <label>Cliente</label>
                <select 
                  value={formData.clientId} 
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  required
                  className="glass"
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label>Tipo de Conteúdo</label>
                <div className="radio-grid">
                  {['carousel', 'reel', 'thread'].map((type) => (
                    <div 
                      key={type} 
                      className={`radio-card glass ${formData.contentType === type ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, contentType: type as any})}
                    >
                      <span className="icon">{type === 'carousel' ? '📁' : type === 'reel' ? '🎬' : '🧵'}</span>
                      <span className="label">{type.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Tom de Voz</label>
                <select 
                  value={formData.tone} 
                  onChange={(e) => setFormData({...formData, tone: e.target.value})}
                  className="glass"
                >
                  <option value="professional">Profissional / Autoritário</option>
                  <option value="friendly">Amigável / Conversacional</option>
                  <option value="energetic">Energético / Motivacional</option>
                  <option value="minimalist">Minimalista / Direto</option>
                </select>
              </div>

              <button type="button" className="btn-primary mt-4" onClick={() => setStep(2)} disabled={!formData.clientId}>
                Próximo Passo →
              </button>
            </div>
          ) : (
            <div className="form-step">
              <div className="input-group">
                <label>Assunto / Tema Principal</label>
                <input 
                  type="text" 
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  placeholder="Ex: Como escalar anúncios no Meta"
                  required
                  className="glass"
                />
              </div>

              <div className="input-group">
                <label>Contexto Adicional (Opcional)</label>
                <textarea 
                  value={formData.additionalContext}
                  onChange={(e) => setFormData({...formData, additionalContext: e.target.value})}
                  placeholder="Adicione detalhes específicos, dores do cliente ou fontes de pesquisa..."
                  className="glass"
                  rows={4}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary glass" onClick={() => setStep(1)}>
                  ← Voltar
                </button>
                <button type="submit" className="btn-primary" disabled={loading || !formData.topic}>
                  {loading ? 'Disparando Cérebro...' : 'Gerar Conteúdo 🚀'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      <style jsx>{`
        .new-pipeline {
          display: flex;
          justify-content: center;
          padding-top: 40px;
        }

        .form-container {
          width: 100%;
          max-width: 600px;
          padding: 40px;
        }

        .form-header {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 40px;
          text-align: center;
        }

        .steps-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .steps-indicator span {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: var(--foreground-muted);
        }

        .steps-indicator span.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
          box-shadow: 0 0 15px var(--accent-glow);
        }

        .line {
          width: 40px;
          height: 2px;
          background: var(--border);
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--foreground-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        select, input, textarea {
          padding: 12px 16px;
          font-size: 16px;
          width: 100%;
          color: var(--foreground);
        }

        .radio-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .radio-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s var(--easing);
        }

        .radio-card.active {
          border-color: var(--accent);
          background: var(--accent-glow);
        }

        .radio-card .icon {
          font-size: 24px;
        }

        .radio-card .label {
          font-size: 11px;
          font-weight: 700;
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 24px;
        }

        .mt-4 { margin-top: 16px; }
      `}</style>
    </div>
  );
}
