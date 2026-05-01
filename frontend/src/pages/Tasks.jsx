import { useEffect, useMemo, useState } from 'react';
import API from '../services/api';
import { getStoredUser } from '../utils/auth';
import { formatDate, getEntityId, isProjectOwner, statusClassName } from '../utils/helpers';

const initialTaskForm = {
  title: '',
  description: '',
  projectId: '',
  assignedTo: '',
  dueDate: '',
  status: 'Todo',
};

function Tasks() {
  const user = getStoredUser();
  const isAdmin = user?.role === 'Admin';
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ projectId: '', mineOnly: false });
  const [formData, setFormData] = useState(initialTaskForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [tasksResponse, projectsResponse] = await Promise.all([API.get('/tasks'), API.get('/projects')]);
      setTasks(tasksResponse.data);
      setProjects(projectsResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load tasks right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const adminProjects = useMemo(
    () => projects.filter((project) => isProjectOwner(project, user?.id)),
    [projects, user?.id]
  );

  const selectedProject = adminProjects.find((project) => project._id === formData.projectId);
  const assignableMembers = selectedProject?.team || [];

  const filteredTasks = tasks.filter((task) => {
    const matchesProject = !filters.projectId || getEntityId(task.project) === filters.projectId;
    const matchesMine = !filters.mineOnly || getEntityId(task.assignedTo) === user?.id;
    return matchesProject && matchesMine;
  });

  const handleTaskFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => {
      const next = { ...current, [name]: value };

      if (name === 'projectId') {
        next.assignedTo = '';
      }

      return next;
    });
  };

  const handleFilterChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await API.post('/tasks', formData);
      setFormData(initialTaskForm);
      setMessage('Task created successfully.');
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create task right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (taskId, status) => {
    setError('');
    setMessage('');

    try {
      await API.put(`/tasks/${taskId}`, { status });
      setTasks((current) =>
        current.map((task) => (task._id === taskId ? { ...task, status } : task))
      );
      setMessage('Task status updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update task status.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const shouldDelete = window.confirm('Delete this task?');

    if (!shouldDelete) {
      return;
    }

    setError('');
    setMessage('');

    try {
      await API.delete(`/tasks/${taskId}`);
      setTasks((current) => current.filter((task) => task._id !== taskId));
      setMessage('Task deleted successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete task right now.');
    }
  };

  const canUpdateTaskStatus = (task) =>
    getEntityId(task.assignedTo) === user?.id || isProjectOwner(task.project, user?.id);

  const canDeleteTask = (task) => isProjectOwner(task.project, user?.id);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Tasks</p>
          <h1>Task assignment & progress</h1>
          <p className="subtitle">
            Admins assign work inside their projects. Members update their own task progress.
          </p>
        </div>
      </div>

      {error ? <div className="message error">{error}</div> : null}
      {message ? <div className="message success">{message}</div> : null}

      {isAdmin ? (
        <section className="panel">
          <div className="section-heading">
            <h2>Create task</h2>
            <span className="tag">Admin only</span>
          </div>

          {adminProjects.length === 0 ? (
            <p className="empty-state">
              You need to create a project first before assigning tasks.
            </p>
          ) : (
            <form className="form-grid" onSubmit={handleCreateTask}>
              <div className="form-row three-column-row">
                <label className="field">
                  <span>Task title</span>
                  <input
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleTaskFormChange}
                    placeholder="Design landing page"
                    required
                  />
                </label>

                <label className="field">
                  <span>Project</span>
                  <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleTaskFormChange}
                    required
                  >
                    <option value="">Select a project</option>
                    {adminProjects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Assign to</span>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleTaskFormChange}
                    required
                    disabled={!formData.projectId}
                  >
                    <option value="">Select a teammate</option>
                    {assignableMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row three-column-row">
                <label className="field">
                  <span>Description</span>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleTaskFormChange}
                    placeholder="What needs to be done?"
                  />
                </label>

                <label className="field">
                  <span>Due date</span>
                  <input
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleTaskFormChange}
                  />
                </label>

                <label className="field">
                  <span>Status</span>
                  <select name="status" value={formData.status} onChange={handleTaskFormChange}>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </label>
              </div>

              <div className="inline-actions">
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Creating...' : 'Create task'}
                </button>
              </div>
            </form>
          )}
        </section>
      ) : null}

      <section className="panel">
        <div className="section-heading">
          <h2>Task list</h2>
          <span className="tag">{filteredTasks.length} shown</span>
        </div>

        <div className="filters">
          <label className="field compact-field">
            <span>Filter by project</span>
            <select name="projectId" value={filters.projectId} onChange={handleFilterChange}>
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox-row">
            <input
              name="mineOnly"
              type="checkbox"
              checked={filters.mineOnly}
              onChange={handleFilterChange}
            />
            <span>Only show my tasks</span>
          </label>
        </div>

        {loading ? <p className="empty-state">Loading tasks...</p> : null}

        {!loading && filteredTasks.length === 0 ? (
          <p className="empty-state">No tasks match the current filters.</p>
        ) : null}

        {!loading && filteredTasks.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assigned to</th>
                  <th>Status</th>
                  <th>Due date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task._id}>
                    <td>
                      <strong>{task.title}</strong>
                      <p>{task.description || 'No description provided.'}</p>
                    </td>
                    <td>{task.project?.name || 'Unknown project'}</td>
                    <td>{task.assignedTo?.name || 'Unassigned'}</td>
                    <td>
                      <select
                        value={task.status}
                        onChange={(event) => handleStatusUpdate(task._id, event.target.value)}
                        disabled={!canUpdateTaskStatus(task)}
                      >
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                      <div className={`status-badge subtle-badge ${statusClassName(task.status)}`}>
                        {task.status}
                      </div>
                    </td>
                    <td>{formatDate(task.dueDate)}</td>
                    <td>
                      {canDeleteTask(task) ? (
                        <button
                          className="btn btn-danger btn-small"
                          type="button"
                          onClick={() => handleDeleteTask(task._id)}
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="muted-text">No admin action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default Tasks;
