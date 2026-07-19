import { useState } from 'react';
import { authApi } from '../api/client';
import { Alert, Field } from '../components/ui';
import { validatePassword } from '../utils/validation';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      setSuccess('');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      setSuccess('');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await authApi.updatePassword(password);
      setSuccess('Password updated successfully');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Update password</h1>
          <p>Use 8–16 characters with at least one uppercase letter and one special character.</p>
        </div>
      </div>

      <form className="panel" style={{ maxWidth: 480 }} onSubmit={handleSubmit}>
        <Alert>{error}</Alert>
        <Alert type="success">{success}</Alert>
        <div className="auth-stack">
          <Field label="New password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm password">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
}
