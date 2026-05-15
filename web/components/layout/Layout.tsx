import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, 
  Users, 
  Zap, 
  Settings, 
  Bell, 
  User,
  BrainCircuit,
  Plus,
  BookOpen,
  LogOut
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();

  // Route Protection
  React.useEffect(() => {
    const token = localStorage.getItem('cb_token');
    if (!token && router.pathname !== '/login') {
      router.push('/login');
    }
  }, [router]);

  const navItems = [
    { label: 'PAINEL', path: '/dashboard', icon: LayoutDashboard },
    { label: 'CLIENTES', path: '/clients', icon: Users },
    { label: 'PIPELINES', path: '/pipelines', icon: Zap },
    { label: 'GUIAS DE MARCA', path: '/brand-guides', icon: BookOpen },
    { label: 'CONFIGURAÇÕES', path: '/settings', icon: Settings },
  ];

  if (router.pathname === '/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem('cb_token');
    router.push('/login');
  };

  return (
    <div className="layout-container">
      {/* SIDEBAR VERTICAL */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <BrainCircuit size={28} color="var(--accent)" />
            <span className="brand-name">CREATIVE<br/>BRAIN</span>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.path || router.pathname.startsWith(item.path + '/');
            return (
              <Link key={item.path} href={item.path}>
                <div className={`nav-item ${isActive ? 'active' : ''}`}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {isActive && <div className="active-glow" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>SAIR</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-wrapper">
        <header className="top-bar">
          <div className="top-bar-left">
             <h2 className="current-page">
               {navItems.find(n => router.pathname.startsWith(n.path))?.label || 'VISÃO GERAL'}
             </h2>
          </div>
          
          <div className="top-bar-right">
            <button className="btn-new-pipeline" onClick={() => router.push('/pipelines/new')}>
              <Plus size={18} /> NOVO PIPELINE
            </button>
            
            <div className="header-divider" />
            
            <div className="icon-group">
              <button className="icon-btn"><Bell size={20} /></button>
              {/* MISSÃO 4: Avatar Link para Settings */}
              <button className="icon-btn avatar-btn" onClick={() => router.push('/settings')}>
                <User size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .layout-container {
          display: flex;
          min-height: 100vh;
          background: var(--bg-deep);
        }

        /* SIDEBAR STYLES */
        .sidebar {
          width: 260px;
          height: 100vh;
          background: rgba(10, 11, 13, 0.95);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(20px);
        }

        .sidebar-header {
          padding: 40px 30px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .brand-name {
          font-family: var(--font-heading);
          font-weight: 900;
          font-size: 14px;
          line-height: 1.1;
          letter-spacing: 0.2em;
          color: white;
        }

        .side-nav {
          flex: 1;
          padding: 0 15px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 14px 20px;
          border-radius: var(--radius-md);
          color: var(--foreground-muted);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.3s var(--easing);
          position: relative;
        }

        .nav-item:hover {
          color: white;
          background: rgba(255, 255, 255, 0.03);
        }

        .nav-item.active {
          color: white;
          background: rgba(255, 92, 0, 0.1);
        }

        .active-glow {
          position: absolute;
          left: 0;
          width: 3px;
          height: 20px;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent-glow);
          border-radius: 0 2px 2px 0;
        }

        .sidebar-footer {
          padding: 30px;
          border-top: 1px solid var(--border);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--foreground-muted);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          transition: color 0.2s;
        }

        .logout-btn:hover { color: #EF4444; }

        /* MAIN CONTENT STYLES */
        .main-wrapper {
          flex: 1;
          margin-left: 260px;
          display: flex;
          flex-direction: column;
        }

        .top-bar {
          height: 80px;
          background: rgba(10, 11, 13, 0.5);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .current-page {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .top-bar-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .btn-new-pipeline {
          background: var(--accent);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 15px var(--accent-glow);
          transition: all 0.3s var(--easing);
        }

        .btn-new-pipeline:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--accent-glow);
        }

        .header-divider {
          width: 1px;
          height: 30px;
          background: var(--border);
        }

        .icon-group {
          display: flex;
          gap: 15px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--foreground-muted);
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: var(--surface-hover);
          color: white;
        }

        .avatar-btn {
          border: 1px solid var(--border);
        }

        .page-content {
          padding: 40px;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
        }

        @media (max-width: 1024px) {
          .sidebar { width: 80px; }
          .brand-name, .nav-item span, .logout-btn span { display: none; }
          .main-wrapper { margin-left: 80px; }
          .nav-item { justify-content: center; padding: 14px; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
