import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../services/api';
import { getStoredUser } from '../utils/auth';
import { formatDate, getEntityId, isProjectOwner, statusClassName } from '../utils/helpers';

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadProjectData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const requests = [API.get(`/projects/${projectId}`), API.get(`/tasks/project/${projectId}`)];

      if (user?.role === 'Admin') {
        requests.push(API.get('/users'));
      }

      const responses = await Promise.all(requests);
      const projectData = responses[0].data;

      setProject(projectData);
      setEditForm({
        name: projectData.name || '',
        description: projectData.description || '',
      });
      setTasks(responses[1].data);
      setUsers(responses[2]?.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load this project right now.');
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.role]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  const isOwner = isProjectOwner(project, user?.id);

  const availableUsers = useMemo(() => {
    if (!project) {
      return [];
    }

    return users.filter(
      (candidate) => !project.team?.some((member) => getEntityId(member) === candidate._id)
    );
  }, [project, users]);

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleUpdateProject = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { data } = await API.put(`/projects/${projectId}`, editForm);
      setProject(data);
      setMessage('Project details updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this project right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { data } = await API.post(`/projects/${projectId}/team`, { userId: memberId });
      setProject(data);
      setMemberId('');
      setMessage('Team member added successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to add team member right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    const shouldDelete = window.confirm('Delete this project and all of its tasks?');

    if (!shouldDelete) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await API.delete(`/projects/${projectId}`);
      navigate('/projects');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete this project right now.');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="panel empty-state">Loading project details...</div>;
  }

  if (!project) {
    return <div className="panel empty-state">Project not found.</div>;
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Project details</p>
          <h1>{project.name}</h1>
          <p className="subtitle">{project.description || 'No description provided.'}</p>
        </div>

        <div className="inline-actions">
          <Link className="btn btn-secondary" to="/tasks">
            Manage tasks
          </Link>
          {isOwner ? (
            <button
              className="btn btn-danger"
              type="button"
              onClick={handleDeleteProject}
              disabled={saving}
            >
              Delete project
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="message error">{error}</div> : null}
      {message ? <div className="message success">{message}</div> : null}

      <div className="card-grid two-column-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Project summary</h2>
            <span className="tag">{isOwner ? 'Owner access' : 'Member access'}</span>
          </div>

          <div className="list">
            <div className="list-item">
              <div>
                <strong>Owner</strong>
                <p>{project.admin?.name || 'Unknown owner'}</p>
              </div>
              <div className="list-meta">
                <span>{project.admin?.email}</span>
              </div>
            </div>
            <div className="list-item">
              <div>
                <strong>Team size</strong>
                <p>{project.team?.length || 0} members</p>
              </div>
              <div className="list-meta">
                <span>{tasks.length} tasks</span>
              </div>
            </div>
          </div>
        </section>

        {isOwner ? (
          <section className="panel">
            <div className="section-heading">
              <h2>Edit project</h2>
              <span className="tag">Admin only</span>
            </div>

            <form className="form-grid" onSubmit={handleUpdateProject}>
              <label className="field">
                <span>Project name</span>
                <input
                  name="name"
                  type="text"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                />
              </label>

              <label className="field">
                <span>Description</span>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                />
              </label>

              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </section>
        ) : null}
      </div>

      <div className="card-grid two-column-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Team members</h2>
            <span className="tag">{project.team?.length || 0} members</span>
          </div>

          <div className="list">
            {project.team?.map((member) => (
              <div className="list-item" key={member._id}>
                <div>
                  <strong>{member.name}</strong>
                  <p>{member.email}</p>
                </div>
                <div className="list-meta">
                  <span>{member.role}</span>
                  <span>{member._id === project.admin?._id ? 'Project owner' : 'Team member'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {isOwner ? (
          <section className="panel">
            <div className="section-heading">
              <h2>Add teammate</h2>
              <span className="tag">Admin only</span>
            </div>

            {availableUsers.length === 0 ? (
              <p className="empty-state">All available users are already part of this project.</p>
            ) : (
              <form className="form-grid" onSubmit={handleAddMember}>
                <label className="field">
                  <span>Select user</span>
                  <select value={memberId} onChange={(event) => setMemberId(event.target.value)} required>
                    <option value="">Choose a user</option>
                    {availableUsers.map((candidate) => (
                      <option key={candidate._id} value={candidate._id}>
                        {candidate.name} ({candidate.role})
                      </option>
                    ))}
                  </select>
                </label>

                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Adding...' : 'Add teammate'}
                </button>
              </form>
            )}
          </section>
        ) : null}
      </div>

      <section className="panel">
        <div className="section-heading">
          <h2>Project tasks</h2>
          <span className="tag">{tasks.length} tasks</span>
        </div>

        {tasks.length === 0 ? (
          <p className="empty-state">No tasks have been created for this project yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assigned to</th>
                  <th>Status</th>
                  <th>Due date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td>
                      <strong>{task.title}</strong>
                      <p>{task.description || 'No description provided.'}</p>
                    </td>
                    <td>{task.assignedTo?.name || 'Unknown member'}</td>
                    <td>
                      <span className={`status-badge ${statusClassName(task.status)}`}>{task.status}</span>
                    </td>
                    <td>{formatDate(task.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default ProjectDetails;
