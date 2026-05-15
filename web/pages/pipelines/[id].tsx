import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';

interface PipelineDetail {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  topic: string;
  content_type: string;
  copy_output?: {
    hook: string;
    body: string;
    cta: string;
    slides?: any[];
  };
  visual_output?: {
    publicUrl: string;
    prompt: string;
  };
  motion_output?: {
    publicUrl?: string;
    status: string;
  };
}

export default function PipelineDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [pipeline, setPipeline] = useState<PipelineDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPipeline = async () => {
      try {
        const response = await api.get(`/pipelines/${id}`);
        setPipeline(response.data);
        
        // If still running, poll every 3 seconds
        if (response.data.status === 'running' || response.data.status === 'pending') {
          setTimeout(fetchPipeline, 3000);
        }
      } catch (err) {
        console.error('Error fetching pipeline', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPipeline();
  }, [id]);

  if (loading && !pipeline) return <div className="p-8">Carregando cérebro...</div>;
  if (!pipeline) return <div className="p-8">Pipeline não encontrado.</div>;

  return (
    <div className="pipeline-detail">
      <Head>
        <title>{pipeline.topic} | Creative Brain</title>
      </Head>

      <div className="detail-header">
        <button onClick={() => router.back()} className="back-btn">← Voltar</button>
        <div className="status-badge-container">
           <span className={`status-badge ${pipeline.status}`}>{pipeline.status.toUpperCase()}</span>
        </div>
      </div>

      <div className="main-grid">
        {/* Coluna da Esquerda: Copy Approval */}
        <div className="content-card glass">
          <div className="card-header">
            <h3>📝 Copy Engine Output</h3>
            <span className="badge">Gemma 4 Optimized</span>
          </div>
          
          <div className="copy-content">
            <div className="copy-section">
              <label>Hook (O Gancho)</label>
              <div className="text-area glass">{pipeline.copy_output?.hook || 'Gerando...'}</div>
            </div>

            <div className="copy-section">
              <label>Body (O Conteúdo)</label>
              <div className="text-area glass">{pipeline.copy_output?.body || 'Aguardando Copy Agent...'}</div>
            </div>

            <div className="copy-section">
              <label>CTA (Chamada para Ação)</label>
              <div className="text-area glass">{pipeline.copy_output?.cta || '---'}</div>
            </div>
          </div>

          <div className="card-actions">
            <button className="btn-secondary glass">Ajustar com IA</button>
            <button className="btn-primary">Aprovar Copy</button>
          </div>
        </div>

        {/* Coluna da Direita: Visual & Motion Preview */}
        <div className="preview-column">
          <div className="content-card glass">
            <div className="card-header">
              <h3>🎨 Visual Assets</h3>
              <span className="badge">Freepik 8D</span>
            </div>
            
            <div className="visual-preview">
              {pipeline.visual_output?.publicUrl ? (
                <img src={pipeline.visual_output.publicUrl} alt="AI Generated" className="preview-img" />
              ) : (
                <div className="skeleton-preview pulse">
                  <span>Gerando Imagem...</span>
                </div>
              )}
            </div>
          </div>

          <div className="content-card glass mt-6">
            <div className="card-header">
              <h3>🎬 Motion Render</h3>
              <span className="badge">Remotion + GSAP</span>
            </div>
            
            <div className="video-preview">
              {pipeline.motion_output?.publicUrl ? (
                <video src={pipeline.motion_output.publicUrl} controls className="preview-video" />
              ) : (
                <div className="skeleton-preview pulse">
                   <span>{pipeline.status === 'running' ? 'Renderizando vídeo...' : 'Aguardando aprovação da copy'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pipeline-detail {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .back-btn {
          color: var(--foreground-muted);
          font-weight: 500;
          font-size: 14px;
        }

        .back-btn:hover {
          color: var(--foreground);
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .status-badge.pending { background: #333; color: #aaa; }
        .status-badge.running { background: var(--accent-glow); color: var(--accent); border: 1px solid var(--accent); }
        .status-badge.completed { background: rgba(16, 185, 129, 0.2); color: #10B981; }

        .main-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
          align-items: start;
        }

        .content-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .badge {
          font-size: 10px;
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: 4px;
          color: var(--foreground-muted);
          text-transform: uppercase;
        }

        .copy-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .copy-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .copy-section label {
          font-size: 12px;
          font-weight: 600;
          color: var(--foreground-muted);
          text-transform: uppercase;
        }

        .text-area {
          padding: 16px;
          min-height: 80px;
          font-size: 15px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .card-actions {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }

        .visual-preview, .video-preview {
          width: 100%;
          aspect-ratio: 1/1;
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .video-preview {
          aspect-ratio: 9/16;
        }

        .preview-img, .preview-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .skeleton-preview {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--foreground-muted);
          font-size: 14px;
          background: linear-gradient(90deg, #0a0a0c 25%, #1a1a1c 50%, #0a0a0c 75%);
          background-size: 200% 100%;
        }

        .pulse {
          animation: loading 1.5s infinite;
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .mt-6 { margin-top: 24px; }

        @media (max-width: 1024px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
