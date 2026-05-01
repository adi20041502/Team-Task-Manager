import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { getStoredUser } from '../utils/auth';
import { getEntityId } from '../utils/helpers';

const initialForm = {
  name: '',
  description: '',
  teamMemberIds: [],
};

function Projects() {
  const user = getStoredUser();
  const isAdmin = user?.role === 'Admin';
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const requests = [API.get('/projects')];

      if (isAdmin) {
        requests.push(API.get('/users'));
      }

      const [projectsResponse, usersResponse] = await Promise.all(requests);
      setProjects(projectsResponse.data);
      setUsers((usersResponse?.data || []).filter((candidate) => candidate._id !== user?.id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load projects right now.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.id]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleTeamMemberToggle = (event) => {
    const { value, checked } = event.target;

    setFormData((current) => ({
      ...current,
      teamMemberIds: checked
        ? [...new Set([...current.teamMemberIds, value])]
        : current.teamMemberIds.filter((memberId) => memberId !== value),
    }));
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await API.post('/projects', formData);
      setFormData(initialForm);
      setMessage('Project created successfully.');
      await loadProjects();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create project right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Projects</p>
          <h1>Projects & team access</h1>
          <p className="subtitle">
            Admins can create projects and add teammates right away. Members can open the projects
            they belong to and track work.
          </p>
        </div>
      </div>

      {error ? <div className="message error">{error}</div> : null}
      {message ? <div className="message success">{message}</div> : null}

      {isAdmin ? (
        <section className="panel">
          <div className="section-heading">
            <h2>Create project</h2>
            <span className="tag">Admin only</span>
          </div>

          <form className="form-grid" onSubmit={handleCreateProject}>
            <div className="form-row two-column-row">
              <label className="field">
                <span>Project name</span>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Website redesign"
                  required
                />
              </label>

              <label className="field">
                <span>Description</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short project summary"
                />
              </label>
            </div>

            <div className="field">
              <span>Add team members</span>

              {users.length === 0 ? (
                <p className="empty-state">
                  No other users are available yet. You can still create the project and add
                  teammates later.
                </p>
              ) : (
                <>
                  <div className="selection-list">
                    {users.map((candidate) => (
                      <label className="selection-option" key={candidate._id}>
                        <div>
                          <strong>{candidate.name}</strong>
                          <p>
                            {candidate.email} · {candidate.role}
                          </p>
                        </div>
                        <input
                          className="selection-toggle"
                          type="checkbox"
                          value={candidate._id}
                          checked={formData.teamMemberIds.includes(candidate._id)}
                          onChange={handleTeamMemberToggle}
                        />
                      </label>
                    ))}
                  </div>

                  <p className="muted-text">
                    {formData.teamMemberIds.length} teammate
                    {formData.teamMemberIds.length === 1 ? '' : 's'} selected.
                  </p>
                </>
              )}
            </div>

            <div className="inline-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create project'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="panel">
        <div className="section-heading">
          <h2>Accessible projects</h2>
          <span className="tag">{projects.length} total</span>
        </div>

        {loading ? <p className="empty-state">Loading projects...</p> : null}

        {!loading && projects.length === 0 ? (
          <p className="empty-state">No projects available yet.</p>
        ) : null}

        {!loading && projects.length > 0 ? (
          <div className="card-grid">
            {projects.map((project) => (
              <article className="panel project-card" key={project._id}>
                <div className="section-heading">
                  <h3>{project.name}</h3>
                  <span className="tag">
                    {getEntityId(project.admin) === user?.id ? 'Owner' : 'Member'}
                  </span>
                </div>
                <p>{project.description || 'No description provided.'}</p>
                <div className="card-meta">
                  <span>{project.team?.length || 0} team members</span>
                  <span>{project.admin?.name || 'Unknown owner'}</span>
                </div>
                <Link className="btn btn-secondary" to={`/projects/${project._id}`}>
                  Open project
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default Projects;
