import React, { useState, useEffect } from 'react';
import { Shield, User, Lock, CheckCircle2, AlertCircle, Search, CreditCard, ArrowRight, LogOut } from 'lucide-react';
import { appwriteFunctions, databases, salesCollectionId, databaseId } from '../lib/appwrite';
import { Query } from 'appwrite';
import './pages.css';

// Pre-calculated SHA-256 for "@Achmed02262004"
// I will compare the hex of the user input password
const AUTH = {
  username: 'achmedbasith',
  // SHA-256 of "@Achmed02262004"
  passwordHash: '840f17b629479695d7e7e6f3d1797380927c8d9b23616ae3824bb8b6f3aef39f' 
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);
  const [duration, setDuration] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activating, setActivating] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    // Check local storage for session
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
    if (!databaseId) return;
    setLoadingUsers(true);
    try {
      // Try to get unique users from sales collection or other collections
      // Since Appwrite doesn't have a distinct query, we list and filter uniquely
      const resp = await databases.listDocuments(databaseId, salesCollectionId, [
        Query.limit(5000),
        Query.orderDesc('$createdAt')
      ]);
      
      const uniqueUsers = new Map();
      resp.documents.forEach((doc: any) => {
        if (doc.clerkUserId && !uniqueUsers.has(doc.clerkUserId)) {
          uniqueUsers.set(doc.clerkUserId, {
            id: doc.clerkUserId,
            lastSeen: doc.$createdAt,
            orgId: doc.orgId
          });
        }
      });
      
      setUsers(Array.from(uniqueUsers.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedUser) return;
    setActivating(true);
    setStatusMsg({ type: 'info', text: 'Activating plan...' });

    try {
      // Call the appwrite function
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
      } else {
        setStatusMsg({ type: 'error', text: result.message || 'Failed to activate plan' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error executing activation' });
    } finally {
      setActivating(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h3>Search User</h3>
            </div>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Search Clerk User ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="user-list">
              {loadingUsers ? (
                <div className="loading-spinner">Loading users...</div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                  <div 
                    key={u.id} 
                    className={`user-item ${selectedUser?.id === u.id ? 'selected' : ''}`}
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="u-info">
                      <span className="u-id">{u.id}</span>
                      <span className="u-meta">Last seen: {new Date(u.lastSeen).toLocaleDateString()}</span>
                    </div>
                    {selectedUser?.id === u.id && <CheckCircle2 size={18} color="#22C55E" />}
                  </div>
                ))
              ) : (
                <div className="no-users">No users found. Try searching by ID manually.</div>
              )}
            </div>
            <div className="manual-entry">
              <p>Or Enter ID manually:</p>
              <input 
                type="text" 
                placeholder="clerk_user_..." 
                onBlur={(e) => setSelectedUser({ id: e.target.value, orgId: null })}
              />
            </div>
          </div>

          {/* Activation Panel */}
          <div className="admin-card">
            <div className="card-header">
              <CreditCard size={20} />
              <h3>Activate Plan</h3>
            </div>
            
            {selectedUser ? (
              <div className="activation-form">
                <div className="selected-user-box">
                  <label>Selected User ID</label>
                  <div className="id-val">{selectedUser.id}</div>
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
                  disabled={activating}
                  onClick={handleActivate}
                >
                  {activating ? 'Processing...' : 'Activate Plan Now'}
                  {!activating && <ArrowRight size={18} />}
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
