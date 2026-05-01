import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { isAuthenticated, storeSession } from '../utils/auth';

const initialState = {
  name: '',
  email: '',
  password: '',
  role: 'Member',
};

function Signup() {
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
      const { data } = await API.post('/auth/signup', formData);
      storeSession(data.token, data.user);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="panel auth-card">
        <div className="auth-header">
          <p className="eyebrow">Team Task Manager</p>
          <h1>Create account</h1>
          <p>Choose whether this account should sign up as an Admin or a Member.</p>
        </div>

        {error ? <div className="message error">{error}</div> : null}

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              required
            />
          </label>

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
              placeholder="At least 6 characters"
              required
            />
          </label>

          <label className="field">
            <span>Role</span>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
            </select>
          </label>

          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
