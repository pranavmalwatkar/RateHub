import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Field } from '../components/ui';
import { validateEmail } from '../utils/validation';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {
      email: validateEmail(email),
      password: password ? '' : 'Password is required',
    };
    setErrors(next);
    if (next.email || next.password) return;

    setSubmitting(true);
    setApiError('');
    try {
      const loggedIn = await login(email.trim(), password);
      if (loggedIn.role === 'ADMIN') navigate('/admin');
      else if (loggedIn.role === 'STORE_OWNER') navigate('/owner');
      else navigate('/stores');
    } catch (err) {
      setApiError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <div className="brand" style={{ color: 'white' }}>
          <span className="brand-mark">R</span>
          <span>RateHub</span>
        </div>
        <div>
          <h1>Rate stores with clarity and trust.</h1>
          <p>One login for shoppers, owners, and admins — discover stores and share honest scores from 1 to 5.</p>
        </div>
        <p className="muted" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Simple. Secure. Role-aware.
        </p>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Welcome back</h2>
          <p>Sign in to continue to your dashboard.</p>
          <Alert>{apiError}</Alert>
          <div className="auth-stack">
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Password" error={errors.password}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
              />
            </Field>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
          <p className="auth-footer">
            New here? <Link to="/signup">Create a normal user account</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
