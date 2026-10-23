import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, 
  CheckSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Badge from '../components/common/Badge';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    setError('');
    try {
      const response = await dashboardApi.getMetrics();
      setData(response);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    dashboardApi.getMetrics()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to fetch dashboard metrics.');
          setIsLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#71717a' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <RefreshCw className="animate-spin" size={24} />
          <span style={{ fontSize: '13px' }}>Syncing metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-banner">
        <AlertCircle size={18} color="#b91c1c" />
        <div>
          <div className="alert-title">System Error</div>
          <div className="alert-desc">{error}</div>
        </div>
      </div>
    );
  }

  const { metrics, overdueAlerts, projectSummaries } = data;

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        background: '#ffffff',
        padding: '20px 24px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--navy-dark)', letterSpacing: '-0.3px' }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Here is your live team velocity, project health, and deadline tracking overview.
          </p>
        </div>

        <button 
          type="button" 
          onClick={fetchDashboardData} 
          className="btn btn-secondary btn-sm"
          title="Refresh metrics from PostgreSQL"
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 5 Core Mandatory Metric Cards */}
      <div className="metrics-grid">
        {/* Metric 1: Total Projects */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Projects</span>
            <div className="metric-icon-box">
              <FolderKanban size={15} />
            </div>
          </div>
          <div className="metric-value">{metrics.total_projects}</div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Active portfolios</span>
        </div>

        {/* Metric 2: Total Tasks */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Tasks</span>
            <div className="metric-icon-box">
              <CheckSquare size={15} />
            </div>
          </div>
          <div className="metric-value">{metrics.total_tasks}</div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Across all initiatives</span>
        </div>

        {/* Metric 3: Completed Tasks */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Completed</span>
            <div className="metric-icon-box" style={{ color: 'var(--success)' }}>
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div className="metric-value">
            {metrics.completed_tasks}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--success)', marginTop: '6px', fontWeight: '500' }}>
            {metrics.completion_rate}% completion rate
          </span>
        </div>

        {/* Metric 4: Pending Tasks */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">In Flight</span>
            <div className="metric-icon-box" style={{ color: 'var(--info)' }}>
              <Clock size={15} />
            </div>
          </div>
          <div className="metric-value">
            {metrics.pending_tasks}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
            To Do & In Progress
          </span>
        </div>

        {/* Metric 5: Overdue Tasks */}
        <div className="metric-card" style={{ borderColor: metrics.overdue_tasks > 0 ? 'var(--danger-border)' : 'var(--border-subtle)' }}>
          <div className="metric-header">
            <span className="metric-label" style={{ color: metrics.overdue_tasks > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
              Overdue
            </span>
            <div className="metric-icon-box" style={{ color: metrics.overdue_tasks > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
              <AlertCircle size={15} />
            </div>
          </div>
          <div className="metric-value" style={{ color: metrics.overdue_tasks > 0 ? 'var(--danger)' : 'var(--navy-dark)' }}>
            {metrics.overdue_tasks}
          </div>
          <span style={{ fontSize: '12px', color: metrics.overdue_tasks > 0 ? 'var(--danger)' : 'var(--text-muted)', marginTop: '6px', fontWeight: '500' }}>
            {metrics.overdue_tasks > 0 ? 'Requires attention' : 'All targets on schedule'}
          </span>
        </div>
      </div>

      {/* Overdue Task Notification Banner (Bonus Criterion) */}
      {overdueAlerts && overdueAlerts.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--danger-border)', backgroundColor: '#fffafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color="var(--danger)" />
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--danger)' }}>
                  Overdue Tasks Requiring Action ({metrics.overdue_tasks})
                </h3>
              </div>
            </div>

            <Link to="/tasks?overdue=true" className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>
              <span>View In Task Board</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Deadline</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {overdueAlerts.map((task) => (
                  <tr key={task.id}>
                    <td style={{ fontWeight: '600', color: 'var(--navy-dark)' }}>{task.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{task.project_name}</td>
                    <td>{task.assignee_name || <em style={{ color: 'var(--text-muted)' }}>Unassigned</em>}</td>
                    <td>
                      <Badge isOverdue={true} value={task.due_date} />
                    </td>
                    <td>
                      <Badge type="priority" value={task.priority} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Progress Summary Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Project Progress & Completion Velocity</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Real-time task resolution metrics aggregated across all active portfolios.
            </p>
          </div>
          <Link to="/projects" className="btn btn-secondary btn-sm">
            <span>Portfolio View</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projectSummaries.map((proj) => (
            <div key={proj.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#09090b' }}>
                  {proj.name}
                </span>
                <span style={{ fontSize: '12.5px', color: '#71717a', fontFamily: 'ui-monospace, monospace' }}>
                  {proj.completed_tasks} / {proj.total_tasks} tasks ({proj.progress}%)
                </span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${proj.progress}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
