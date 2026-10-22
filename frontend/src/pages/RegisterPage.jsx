import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            Create Account
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            Join Bright Mind's Project Management System
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
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              required
              className="input-field"
              placeholder="e.g. David Miller"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              placeholder="e.g. david.dev@brightmind.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password (min 6 chars)</label>
            <input
              id="password"
              type="password"
              required
              className="input-field"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              className="input-field"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: '15px' }}
          >
            {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#4f46e5', fontWeight: '600', textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
