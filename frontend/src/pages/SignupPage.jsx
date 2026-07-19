import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Field } from '../components/ui';
import {
  validateAddress,
  validateEmail,
  validateName,
  validatePassword,
} from '../utils/validation';

export default function SignupPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', address: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      address: validateAddress(form.address),
      password: validatePassword(form.password),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    setApiError('');
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        password: form.password,
      });
      navigate('/stores');
    } catch (err) {
      setApiError(err.message || 'Signup failed');
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
          <h1>Join and start rating stores today.</h1>
          <p>Create a normal user account to browse registered stores and submit ratings from 1–5.</p>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.75)' }}>Name must be 20–60 characters.</p>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Create account</h2>
          <p>Normal users can register here.</p>
          <Alert>{apiError}</Alert>
          <div className="auth-stack">
            <Field label="Name" error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Full name (20–60 characters)"
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Address" error={errors.address}>
              <textarea
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Your address (max 400 characters)"
              />
            </Field>
            <Field label="Password" error={errors.password}>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="8–16 chars, 1 uppercase, 1 special"
              />
            </Field>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Sign up'}
            </button>
          </div>
          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
