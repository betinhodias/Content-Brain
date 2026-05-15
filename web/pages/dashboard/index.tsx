import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { api } from '@/lib/api';
import { 
  Users, 
  Zap, 
  Eye, 
  Film, 
  ChevronRight, 
  PlusCircle, 
  FileUp, 
  UserPlus,
  Activity
} from 'lucide-react';

interface Pipeline {
  id: string;
  client_id: string;
  content_type: 'carousel' | 'reel' | 'thread';
  topic: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
}

export default function DashboardPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [realStats, setRealStats] = useState({ clients: 0, pipelinesToday: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [pipelinesRes, statsRes] = await Promise.all([
          api.get('/pipelines?limit=5'),
          api.get('/stats')
        ]);
        setPipelines(pipelinesRes.data.data || []);
        setRealStats(statsRes.data.data);
      } catch (err: any) {
        console.error('Failed to load data', err);
        setError(err.response?.data?.error || 'Erro de conexão com o cérebro.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = [
    { label: 'CLIENTES ATIVOS', value: realStats.clients.toString(), icon: Users, color: 'var(--accent)' },
    { label: 'PIPELINES HOJE', value: realStats.pipelinesToday.toString(), icon: Zap, color: '#FFBD00' },
    { label: 'AGUARDANDO APROVAÇÃO', value: realStats.pending.toString(), icon: Eye, color: '#FF0055' },
    { label: 'RENDERS CONCLUÍDOS', value: realStats.completed.toString(), icon: Film, color: '#00D1FF' },
  ];

  return (
    <div className="dashboard-page">
      <Head>
        <title>DASHBOARD | CREATIVE BRAIN</title>
      </Head>

      <div className="stats-grid">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="stat-card glass glass-hover">
              <div className="stat-icon-wrapper" style={{ border: `1px solid ${stat.color}40` }}>
                <Icon size={24} style={{ color: stat.color }} />
              </div>
              <div className="stat-info">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
              <div className="stat-glow" style={{ background: stat.color }} />
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="recent-pipelines glass">
          <div className="card-header">
            <h3><Activity size={18} /> RECENT PIPELINES</h3>
            <button className="text-link">VIEW ALL <ChevronRight size={14} /></button>
          </div>
          
          <div className="pipeline-list">
            {loading ? (
              <div className="loading">LOADING ENGINE...</div>
            ) : error ? (
              <div className="error-state">{error}</div>
            ) : pipelines.length === 0 ? (
              <div className="empty-state">NO ACTIVE PIPELINES</div>
            ) : (
              pipelines.map((p) => (
                <div key={p.id} className="pipeline-item">
                  <div className={`status-indicator ${p.status}`} />
                  <div className="pipeline-info">
                    <span className="pipeline-topic">{p.topic.toUpperCase()}</span>
                    <span className="pipeline-meta text-mono">
                      {p.content_type.toUpperCase()} // {new Date(p.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="pipeline-actions">
                    <button className="btn-small glass glass-hover">OPEN</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="quick-actions">
          <div className="action-card glass glass-hover" onClick={() => window.location.href='/pipelines/new'}>
            <div className="action-icon orange"><PlusCircle size={32} /></div>
            <div className="action-text">
              <h4>NEW PIPELINE</h4>
              <p>Start content generation</p>
            </div>
          </div>
          
          <div className="action-card glass glass-hover">
            <div className="action-icon blue"><FileUp size={32} /></div>
            <div className="action-text">
              <h4>BRAND GUIDE</h4>
              <p>Train the AI brain</p>
            </div>
          </div>

          <div className="action-card glass glass-hover">
            <div className="action-icon green"><UserPlus size={32} /></div>
            <div className="action-text">
              <h4>ADD CLIENT</h4>
              <p>Register new tenant</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }

        .stat-card {
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 24px;
          position: relative;
          overflow: hidden;
        }

        .stat-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.2);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          z-index: 1;
        }

        .stat-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--foreground-muted);
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .stat-glow {
          position: absolute;
          right: -20px;
          top: -20px;
          width: 80px;
          height: 80px;
          filter: blur(50px);
          opacity: 0.15;
          border-radius: 50%;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }

        .recent-pipelines {
          padding: 32px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .card-header h3 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          letter-spacing: 0.1em;
        }

        .text-link {
          font-size: 12px;
          color: var(--accent);
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pipeline-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pipeline-item {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s var(--easing);
        }

        .pipeline-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          transform: translateX(4px);
        }

        .status-indicator {
          width: 4px;
          height: 32px;
          border-radius: 2px;
        }

        .status-indicator.pending { background: #333; }
        .status-indicator.running { background: var(--accent); box-shadow: 0 0 10px var(--accent); }
        .status-indicator.completed { background: var(--success); }
        .status-indicator.failed { background: var(--error); }

        .pipeline-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pipeline-topic {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .pipeline-meta {
          font-size: 10px;
          color: var(--foreground-muted);
        }

        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .action-card {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
        }

        .action-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
        }

        .action-icon.orange { color: #FF5C00; }
        .action-icon.blue { color: #00D1FF; }
        .action-icon.green { color: #10B981; }

        .action-text h4 {
          font-size: 14px;
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }

        .action-text p {
          font-size: 12px;
          color: var(--foreground-muted);
        }

        .btn-small {
          padding: 8px 16px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        @media (max-width: 1280px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .quick-actions {
            flex-direction: row;
          }
          .action-card {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
