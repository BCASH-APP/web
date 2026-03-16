import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, User, Lock, CheckCircle2, AlertCircle, Search, CreditCard, ArrowRight, LogOut, Info } from 'lucide-react';
import { appwriteFunctions } from '../lib/appwrite';
import './pages.css';

const AUTH = {
  username: 'achmedbasith',
  passwordHash: '50d838d127f5eca595ad9578a46e3dd4bfd9bf92bad61989810299a2e06e5422'
};

async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const PLANS = [
  { id: 'free_trial', name: 'Free Trial', price: 0 },
  { id: 'basic', name: 'Basic Plan', price: 89000 },
  { id: 'premium', name: 'Premium Plan', price: 239000 }
];

export const SecretAdminPage = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);
  const [duration, setDuration] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activating, setActivating] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const session = sessionStorage.getItem('admin_auth');
    if (session === 'true') {
      setIsAuthorized(true);
      fetchUsers();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const hash = await sha256(password);
    if (username === AUTH.username && hash === AUTH.passwordHash) {
      setIsAuthorized(true);
      sessionStorage.setItem('admin_auth', 'true');
      fetchUsers();
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem('admin_auth');
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const resp = await appwriteFunctions.createExecution(
        '6994b6f5000daf8d8580',
        JSON.stringify({ action: 'list' })
      );
      const result = JSON.parse(resp.responseBody);
      if (result.success) {
        setUsers(result.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const getPlanInfo = useCallback((u: any) => {
    const meta = u.publicMetadata?.planId ? u.publicMetadata : u.unsafeMetadata;
    const planId = meta?.planId || 'none';
    const expiresAt = meta?.expiresAt ? new Date(meta.expiresAt) : null;
    const activatedAt = meta?.activatedAt ? new Date(meta.activatedAt) : null;
    const duration = meta?.duration || meta?.subDuration || null;
    const totalActivations = u.publicMetadata?.totalActivations || 0;
    const isActive = expiresAt ? expiresAt > new Date() : false;

    return { planId, expiresAt, activatedAt, duration, totalActivations, isActive, metaSource: u.publicMetadata?.planId ? 'public' : 'unsafe' };
  }, []);

  const handleMigrate = async () => {
    if (!selectedUser) return;
    const { planId, expiresAt, activatedAt } = getPlanInfo(selectedUser);
    if (planId === 'none') return;

    setActivating(true);
    setStatusMsg({ type: 'info', text: 'Migrating user metadata...' });

    try {
      const payload = {
        clerkUserId: selectedUser.id,
        planId: planId,
        orgId: selectedUser.orgId,
        expiresAt: expiresAt?.toISOString(),
        activatedAt: activatedAt?.toISOString(),
        action: 'migrate'
      };

      const resp = await appwriteFunctions.createExecution(
        '6994b6f5000daf8d8580',
        JSON.stringify(payload)
      );

      const result = JSON.parse(resp.responseBody);
      if (result.success) {
        setStatusMsg({ type: 'success', text: `Successfully migrated ${selectedUser.fullName}` });
        fetchUsers();
      } else {
        setStatusMsg({ type: 'error', text: result.message || 'Failed to migrate' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error executing migration' });
    } finally {
      setActivating(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedUser) return;
    setActivating(true);
    setStatusMsg({ type: 'info', text: 'Activating plan...' });

    try {
      const payload = {
        clerkUserId: selectedUser.id,
        planId: selectedPlan,
        orgId: selectedUser.orgId,
        duration: duration
      };

      const resp = await appwriteFunctions.createExecution(
        '6994b6f5000daf8d8580',
        JSON.stringify(payload)
      );

      const result = JSON.parse(resp.responseBody);
      if (result.success) {
        setStatusMsg({ type: 'success', text: `Successfully activated ${selectedPlan} for ${selectedUser.id}` });
        fetchUsers();
      } else {
        setStatusMsg({ type: 'error', text: result.message || 'Failed to activate plan' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error executing activation' });
    } finally {
      setActivating(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const searchMatch = (
        u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const { isActive, planId } = getPlanInfo(u);

      if (activeTab === 'active') return searchMatch && isActive;
      if (activeTab === 'expired') return searchMatch && !isActive && planId !== 'none';
      return searchMatch;
    });
  }, [users, searchQuery, activeTab, getPlanInfo]);

  if (!isAuthorized) {
    return (
      <div className="secret-admin-container">
        <div className="login-box">
          <div className="login-header">
            <Shield size={48} color="#3d7066" />
            <h2>System Administration</h2>
            <p>Authorization required to access this portal.</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <User size={18} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {loginError && <div className="error-msg">{loginError}</div>}
            <button type="submit" className="login-btn">Secure Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="secret-admin-dashboard">
      <nav className="admin-nav">
        <div className="nav-left">
          <Shield size={24} />
          <span>BCash Admin Portal</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} /> Logout
        </button>
      </nav>

      <main className="admin-main">
        <div className="admin-grid">
          {/* User Selection */}
          <div className="admin-card">
            <div className="card-header">
              <Search size={20} />
              <h3>User Directory</h3>
              <div className="user-count">{filteredUsers.length} Users</div>
            </div>

            <div className="admin-tabs">
              <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>All</button>
              <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Active</button>
              <button className={activeTab === 'expired' ? 'active' : ''} onClick={() => setActiveTab('expired')}>Expired</button>
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder="Search name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="user-list scrollable-zone">
              {loadingUsers ? (
                <div className="loading-spinner">Fetching Users from Clerk...</div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(u => {
                  const { planId, isActive, expiresAt, metaSource, duration } = getPlanInfo(u);
                  return (
                    <div
                      key={u.id}
                      className={`user-list-item ${selectedUser?.id === u.id ? 'selected' : ''}`}
                      onClick={() => setSelectedUser(u)}
                    >
                      <div className="u-main">
                        <div className="u-top">
                          <span className="u-name">{u.fullName}</span>
                          <span className={`u-plan-pill ${isActive ? 'active' : 'inactive'}`}>
                            {planId === 'none' ? 'NO PLAN' : `${planId.toUpperCase()} ${duration ? `(${duration}M)` : ''}`}
                            {metaSource === 'unsafe' && <span className="u-mig-tag">MIG</span>}
                          </span>
                        </div>
                        <div className="u-meta-row">
                          <span className="u-email">{u.email}</span>
                          <span className="u-date">
                            {expiresAt ? `Exp: ${expiresAt.toLocaleDateString()}` : `Joined: ${new Date(u.createdAt).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                      {selectedUser?.id === u.id && <CheckCircle2 size={16} color="#22C55E" />}
                    </div>
                  );
                })
              ) : (
                <div className="no-users">No users found match your filter.</div>
              )}
            </div>
          </div>

          {/* Activation Panel */}
          <div className="admin-card">
            <div className="card-header">
              <CreditCard size={20} />
              <h3>Plan Configuration</h3>
            </div>

            {selectedUser ? (
              <div className="activation-form">
                <div className="user-summary-box compact">
                  <div className="sum-grid-2">
                    <div className="sum-row">
                      <label>Full Name</label>
                      <div className="sum-val">{selectedUser.fullName}</div>
                    </div>
                    <div className="sum-row">
                      <label>User ID</label>
                      <div className="sum-val mono">{selectedUser.id}</div>
                    </div>
                  </div>

                  <div className="sum-grid-2 divider-top">
                    <div className="sum-row">
                      <label>Current Status</label>
                      <div className="sum-val">
                        {getPlanInfo(selectedUser).isActive ? (
                          <span style={{ color: '#22C55E', fontWeight: 800 }}>ACTIVE — {getPlanInfo(selectedUser).planId.toUpperCase()} ({getPlanInfo(selectedUser).duration || '?'}M)</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: 800 }}>EXPIRED / NONE</span>
                        )}
                      </div>
                    </div>
                    <div className="sum-row">
                      <label>Total Activations</label>
                      <div className="sum-val">{getPlanInfo(selectedUser).totalActivations} <Info size={14} style={{ opacity: 0.5, verticalAlign: 'middle' }} /></div>
                    </div>
                  </div>

                  {getPlanInfo(selectedUser).planId !== 'none' && (
                    <div className="sum-grid-2 divider-top">
                      <div className="sum-row">
                        <label>Date Start</label>
                        <div className="sum-val">{getPlanInfo(selectedUser).activatedAt?.toLocaleDateString()}</div>
                      </div>
                      <div className="sum-row">
                        <label>Date End</label>
                        <div className="sum-val">{getPlanInfo(selectedUser).expiresAt?.toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}

                  {getPlanInfo(selectedUser).metaSource === 'unsafe' && (
                    <button
                      className="migrate-btn"
                      onClick={handleMigrate}
                      disabled={activating}
                      style={{ 
                        marginTop: '0.5rem', 
                        background: '#3d7066', 
                        color: 'white', 
                        padding: '0.65rem', 
                        borderRadius: '10px', 
                        border: 'none', 
                        fontWeight: 800, 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      {activating ? 'Migrating...' : 'Fix Metalog (Sync to Public)'}
                      {!activating && <Shield size={14} />}
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Select Plan</label>
                  <div className="plan-buttons">
                    {PLANS.map(p => (
                      <button
                        key={p.id}
                        className={`plan-btn ${selectedPlan === p.id ? 'active' : ''}`}
                        onClick={() => setSelectedPlan(p.id)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Duration (Months)</label>
                  <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months (1 Year)</option>
                  </select>
                </div>

                {statusMsg.text && (
                  <div className={`status-msg ${statusMsg.type}`}>
                    {statusMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{statusMsg.text}</span>
                  </div>
                )}

                <button
                  className="activate-btn"
                  disabled={activating || getPlanInfo(selectedUser).isActive}
                  onClick={handleActivate}
                  style={getPlanInfo(selectedUser).isActive ? { background: '#94a3b8', cursor: 'not-allowed' } : {}}
                >
                  {getPlanInfo(selectedUser).isActive ? 'Plan Already Active' : activating ? 'Processing...' : 'Activate Plan Now'}
                  {!activating && !getPlanInfo(selectedUser).isActive && <ArrowRight size={18} />}
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <User size={48} color="#94a3b8" />
                <p>Please select a user to activate a plan</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
