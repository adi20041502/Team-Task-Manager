import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { getStoredUser } from '../utils/auth';
import { formatDate, getEntityId, isOverdue, statusClassName } from '../utils/helpers';

function Dashboard() {
  const user = getStoredUser();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [projectsResponse, tasksResponse, myTasksResponse] = await Promise.all([
          API.get('/projects'),
          API.get('/tasks'),
          API.get('/tasks?mine=true'),
        ]);

        setProjects(projectsResponse.data);
        setTasks(tasksResponse.data);
        setMyTasks(myTasksResponse.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load dashboard right now.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const completedTasks = tasks.filter((task) => task.status === 'Done').length;
  const overdueTasks = tasks.filter(isOverdue).length;
  const myOpenTasks = myTasks.filter((task) => task.status !== 'Done').length;
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const recentMyTasks = [...myTasks]
    .sort((firstTask, secondTask) => {
      const firstDate = firstTask.dueDate ? new Date(firstTask.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const secondDate = secondTask.dueDate ? new Date(secondTask.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return firstDate - secondDate;
    })
    .slice(0, 5);

  const recentProjects = projects.slice(0, 5);

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
          <p className="subtitle">
            {user?.role === 'Admin'
              ? 'Track project health, assign work, and watch overdue items.'
              : 'See your tasks, project access, and progress at a glance.'}
          </p>
        </div>

        <div className="inline-actions">
          <Link className="btn btn-secondary" to="/projects">
            View projects
          </Link>
          <Link className="btn btn-primary" to="/tasks">
            Open tasks
          </Link>
        </div>
      </div>

      {error ? <div className="message error">{error}</div> : null}

      <div className="card-grid">
        <article className="panel stat-card">
          <span>Projects</span>
          <strong>{projects.length}</strong>
        </article>
        <article className="panel stat-card">
          <span>Total tasks</span>
          <strong>{tasks.length}</strong>
        </article>
        <article className="panel stat-card">
          <span>My open tasks</span>
          <strong>{myOpenTasks}</strong>
        </article>
        <article className="panel stat-card">
          <span>Overdue tasks</span>
          <strong>{overdueTasks}</strong>
        </article>
      </div>

      <div className="card-grid two-column-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>Recent tasks</h2>
            <span className="tag">Completion {completionRate}%</span>
          </div>

          {loading ? <p className="empty-state">Loading tasks...</p> : null}

          {!loading && recentMyTasks.length === 0 ? (
            <p className="empty-state">No tasks assigned yet.</p>
          ) : null}

          {!loading && recentMyTasks.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Due date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMyTasks.map((task) => (
                    <tr key={task._id}>
                      <td>{task.title}</td>
                      <td>{task.project?.name || 'Unknown project'}</td>
                      <td>
                        <span className={`status-badge ${statusClassName(task.status)}`}>{task.status}</span>
                      </td>
                      <td>{formatDate(task.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Project access</h2>
            <Link to="/projects">Manage</Link>
          </div>

          {loading ? <p className="empty-state">Loading projects...</p> : null}

          {!loading && recentProjects.length === 0 ? (
            <p className="empty-state">No projects available yet.</p>
          ) : null}

          {!loading && recentProjects.length > 0 ? (
            <div className="list">
              {recentProjects.map((project) => (
                <div className="list-item" key={project._id}>
                  <div>
                    <strong>{project.name}</strong>
                    <p>{project.description || 'No description provided.'}</p>
                  </div>
                  <div className="list-meta">
                    <span>{project.team?.length || 0} members</span>
                    <span>{getEntityId(project.admin) === user?.id ? 'Owner' : 'Team member'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
