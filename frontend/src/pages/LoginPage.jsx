import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
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
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
        padding: '36px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '20px',
            margin: '0 auto 12px'
          }}>
            BM
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.4px' }}>
            Bright Mind Ltd.
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Smart Task & Project Management System
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
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
            <input
              id="password"
              type="password"
              required
              className="input-field"
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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

        {/* 1-Click Demo Fill Buttons for Interviewers */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <p style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '10px', letterSpacing: '0.5px' }}>
            ⚡ 1-Click Demo Accounts (For Evaluation)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => fillCredentials('alex.admin@brightmind.com', 'password123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
            >
              <ShieldCheck size={16} color="#4f46e5" />
              <span>Fill <strong>Admin</strong> (Alex Turner)</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('john.dev@brightmind.com', 'password123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
            >
              <UserCheck size={16} color="#059669" />
              <span>Fill <strong>Team Member</strong> (John Smith)</span>
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
