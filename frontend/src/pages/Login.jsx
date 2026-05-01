import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { isAuthenticated, storeSession } from '../utils/auth';

const initialState = {
  email: '',
  password: '',
};

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await API.post('/auth/login', formData);
      storeSession(data.token, data.user);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="panel auth-card">
        <div className="auth-header">
          <p className="eyebrow">Team Task Manager</p>
          <h1>Login</h1>
          <p>Sign in to manage projects, tasks, and team progress.</p>
        </div>

        {error ? <div className="message error">{error}</div> : null}

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </label>

          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
