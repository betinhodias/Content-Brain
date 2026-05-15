import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { api } from '@/lib/api';
import { 
  Users, 
  Search, 
  Plus, 
  ExternalLink, 
  Edit3, 
  Folder, 
  X,
  Check,
  Loader2,
  Building2,
  Tag,
  FileText,
  CheckCircle2,
  MoreVertical
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  slug: string;
  industry: string;
  brand_summary: string;
  is_active: boolean;
  created_at: string;
}

export default function ClientManagerPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    industry: '',
    brandSummary: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      setClients(response.data.data || []);
    } catch (err) {
      console.error('Failed to load clients', err);
    } finally {
      setLoading(false);
    }
  }

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData({ ...formData, name, slug });
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/clients', formData);
      setIsModalOpen(false);
      setFormData({ name: '', slug: '', industry: '', brandSummary: '' });
      await loadData();
    } catch (err) {
      console.error('Failed to create client', err);
      alert('Erro ao criar cliente. Verifique o slug (deve ser único).');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="client-manager">
      <Head>
        <title>CLIENTS | CREATIVE BRAIN</title>
      </Head>

      <div className="manager-header">
        <div className="search-bar glass">
          <Search size={18} color="var(--foreground-muted)" />
          <input 
            type="text" 
            placeholder="Search by name or slug..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> NEW CLIENT
        </button>
      </div>

      <div className="table-container glass">
        <table className="clients-table">
          <thead>
            <tr>
              <th>STATUS</th>
              <th>CLIENT / BRAND</th>
              <th>INDUSTRY</th>
              <th>CREATED</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="loading-cell">SYNCING TENANT DATA...</td></tr>
            ) : filteredClients.length === 0 ? (
              <tr><td colSpan={5} className="empty-cell">NO CLIENTS REGISTERED</td></tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="client-row">
                  <td>
                    <div className="status-container">
                       <CheckCircle2 size={14} color="#10B981" />
                       <span className="status-text">ACTIVE</span>
                    </div>
                  </td>
                  <td>
                    <div className="client-info">
                      <span className="client-name">{client.name}</span>
                      <span className="client-slug">@{client.slug}</span>
                    </div>
                  </td>
                  <td>
                    <span className="industry-tag">{client.industry?.toUpperCase() || 'GENERAL'}</span>
                  </td>
                  <td>
                    <span className="date-text">{new Date(client.created_at).toLocaleDateString()}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn-icon" title="View Brand Guide"><Folder size={18} /></button>
                      <button className="btn-icon" title="Edit Client"><Edit3 size={18} /></button>
                      <button className="btn-icon" title="View Details"><ExternalLink size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* NEW CLIENT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass glass-glow">
            <div className="modal-header">
              <div className="modal-title">
                <Building2 size={20} color="var(--accent)" />
                <h3>REGISTER NEW CLIENT</h3>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="modal-form">
              <div className="form-grid">
                <div className="input-group">
                  <label><Building2 size={12} /> CLIENT NAME</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Acme Corp" 
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required 
                  />
                </div>

                <div className="input-group">
                  <label><Tag size={12} /> UNIQUE SLUG</label>
                  <input 
                    type="text" 
                    placeholder="acme-corp" 
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    required 
                  />
                </div>

                <div className="input-group full">
                  <label><Users size={12} /> INDUSTRY</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Technology, Health, Real Estate" 
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  />
                </div>

                <div className="input-group full">
                  <label><FileText size={12} /> BRAND SUMMARY / MISSION</label>
                  <textarea 
                    placeholder="Describe the brand voice, core values and main targets..." 
                    rows={4}
                    value={formData.brandSummary}
                    onChange={(e) => setFormData({...formData, brandSummary: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  CANCEL
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <>CREATE CLIENT <Check size={18} /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .client-manager {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          width: 100%;
          max-width: 400px;
        }

        .search-bar input {
          background: transparent;
          border: none;
          color: white;
          width: 100%;
          outline: none;
          font-size: 14px;
          letter-spacing: 0.05em;
        }

        .clients-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        th {
          padding: 20px 24px;
          font-size: 11px;
          font-weight: 700;
          color: var(--foreground-muted);
          border-bottom: 1px solid var(--border);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        td {
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          vertical-align: middle;
        }

        .client-row {
          transition: background 0.3s var(--easing);
        }

        .client-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .status-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-text {
          font-size: 10px;
          font-weight: 800;
          color: #10B981;
          letter-spacing: 0.05em;
        }

        .client-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .client-name {
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.02em;
        }

        .client-slug {
          font-family: var(--font-technical);
          font-size: 11px;
          color: var(--accent);
          opacity: 0.8;
        }

        .industry-tag {
          font-size: 10px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 10px;
          border-radius: 4px;
          color: var(--foreground-muted);
          border: 1px solid var(--border);
          letter-spacing: 0.05em;
        }

        .date-text {
          font-size: 12px;
          color: var(--foreground-muted);
        }

        .actions {
          display: flex;
          gap: 12px;
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
          background: var(--surface-hover);
          color: white;
          transform: translateY(-2px);
        }

        /* MODAL STYLES */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          width: 100%;
          max-width: 600px;
          padding: 40px;
          border-radius: var(--radius-lg);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .modal-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-title h3 {
          font-size: 18px;
          letter-spacing: 0.1em;
          font-weight: 800;
        }

        .close-btn {
          color: var(--foreground-muted);
          transition: color 0.2s;
        }

        .close-btn:hover { color: white; }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .input-group.full {
          grid-column: span 2;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .input-group label {
          font-size: 10px;
          font-weight: 700;
          color: var(--foreground-muted);
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .input-group input, .input-group textarea {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s var(--easing);
        }

        .input-group input:focus, .input-group textarea:focus {
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.05);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-cell, .empty-cell {
          text-align: center;
          padding: 80px;
          color: var(--foreground-muted);
          font-style: italic;
          font-size: 13px;
          letter-spacing: 0.1em;
        }
      `}</style>
    </div>
  );
}
