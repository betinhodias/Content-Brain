import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { api } from '@/lib/api';
import { 
  Zap, 
  Search, 
  Filter, 
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play
} from 'lucide-react';

interface Pipeline {
  id: string;
  client_id: string;
  content_type: string;
  topic: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
}

export default function PipelinesIndex() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadPipelines() {
      try {
        const response = await api.get('/pipelines');
        setPipelines(response.data.data || []);
      } catch (err) {
        console.error('Failed to load pipelines', err);
      } finally {
        setLoading(false);
      }
    }
    loadPipelines();
  }, []);

  const filteredPipelines = pipelines.filter(p => 
    p.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.content_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pipelines-page">
      <Head>
        <title>PIPELINES | CREATIVE BRAIN</title>
      </Head>

      <div className="filters-bar glass">
        <div className="search-wrapper">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by topic or type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <button className="btn-secondary"><Filter size={16} /> FILTERS</button>
        </div>
      </div>

      <div className="pipelines-table-container glass">
        <table className="pipelines-table">
          <thead>
            <tr>
              <th>STATUS</th>
              <th>PIPELINE / TOPIC</th>
              <th>CLIENT</th>
              <th>TYPE</th>
              <th>CREATED AT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="table-loading">Initializing Neural Engine...</td></tr>
            ) : filteredPipelines.length === 0 ? (
              <tr><td colSpan={6} className="table-empty">No pipelines found for this criteria.</td></tr>
            ) : (
              filteredPipelines.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className={`status-pill ${p.status}`}>
                      {p.status === 'completed' && <CheckCircle2 size={12} />}
                      {p.status === 'running' && <Play size={12} className="animate-pulse" />}
                      {p.status === 'pending' && <Clock size={12} />}
                      {p.status === 'failed' && <AlertCircle size={12} />}
                      {p.status.toUpperCase()}
                    </div>
                  </td>
                  <td className="topic-cell">{p.topic}</td>
                  <td>ID: {p.client_id.slice(0,8)}...</td>
                  <td><span className="type-tag">{p.content_type.toUpperCase()}</span></td>
                  <td className="date-cell">{new Date(p.created_at).toLocaleDateString()} // {new Date(p.created_at).toLocaleTimeString()}</td>
                  <td>
                    <button className="btn-icon" onClick={() => window.location.href=`/pipelines/${p.id}`}>
                      <ExternalLink size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .pipelines-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .filters-bar {
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .search-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          max-width: 400px;
          color: var(--foreground-muted);
        }

        .search-wrapper input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          width: 100%;
          font-size: 14px;
        }

        .pipelines-table-container {
          overflow-x: auto;
        }

        .pipelines-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .pipelines-table th {
          padding: 20px 24px;
          font-size: 11px;
          font-weight: 700;
          color: var(--foreground-muted);
          letter-spacing: 0.1em;
          border-bottom: 1px solid var(--border);
          text-transform: uppercase;
        }

        .pipelines-table td {
          padding: 24px;
          font-size: 13px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          vertical-align: middle;
        }

        .topic-cell {
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .status-pill.completed { background: rgba(16, 185, 129, 0.1); color: #10B981; }
        .status-pill.running { background: rgba(255, 92, 0, 0.1); color: var(--accent); }
        .status-pill.pending { background: rgba(255, 255, 255, 0.05); color: var(--foreground-muted); }
        .status-pill.failed { background: rgba(239, 68, 68, 0.1); color: #EF4444; }

        .type-tag {
          font-family: var(--font-technical);
          font-size: 10px;
          background: rgba(0, 209, 255, 0.1);
          color: #00D1FF;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .date-cell {
          color: var(--foreground-muted);
          font-size: 11px;
        }

        .btn-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          color: var(--foreground-muted);
          transition: all 0.2s var(--easing);
        }

        .btn-icon:hover {
          background: var(--accent);
          color: white;
          box-shadow: 0 0 15px var(--accent-glow);
        }

        .table-loading, .table-empty {
          text-align: center;
          padding: 60px !important;
          color: var(--foreground-muted);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
