import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      const f = location.state?.from;
      navigate(f ? `${f.pathname}${f.search || ''}${f.hash || ''}` : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setShowPassword(true); // Reveal password so user sees it clearly
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        padding: '36px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'var(--navy-dark)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '18px',
            margin: '0 auto 12px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            BM
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--navy-dark)', letterSpacing: '-0.4px' }}>
            Bright Mind Ltd.
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Smart Task & Project Management System
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            border: '1px solid var(--danger-border)',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              placeholder="e.g. alex.admin@brightmind.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field"
                style={{ paddingRight: '40px' }}
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Demo password for all accounts: <code>password123</code>
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: '15px' }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* 1-Click Instant Demo Login Buttons */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <p style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.5px' }}>
            ⚡ Demo Accounts (Click to Fill Fields)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => fillCredentials('alex.admin@brightmind.com', 'password123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', padding: '10px 12px', flexWrap: 'wrap', gap: '6px' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, textAlign: 'left' }}>
                <ShieldCheck size={16} color="var(--navy-ocean)" style={{ flexShrink: 0 }} />
                <span>Fill <strong>Admin</strong> (Alex Turner)</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--navy-ocean)', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Full Access
              </span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('john.dev@brightmind.com', 'password123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', padding: '10px 12px', flexWrap: 'wrap', gap: '6px' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, textAlign: 'left' }}>
                <UserCheck size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                <span>Fill <strong>Team Member</strong> (John Smith)</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--success)', background: 'var(--success-bg)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Member View
              </span>
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--navy-ocean)', fontWeight: '600', textDecoration: 'none' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
