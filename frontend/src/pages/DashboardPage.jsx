import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, 
  CheckSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Badge from '../components/common/Badge';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await dashboardApi.getMetrics();
      setData(response);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#4f46e5' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <RefreshCw className="animate-spin" size={28} />
          <span>Loading organization metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-banner">
        <AlertTriangle size={20} color="#b91c1c" />
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
        marginBottom: '28px',
        background: '#ffffff',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
            System overview for Bright Mind Ltd. Here is your team's live task velocity and deadline status.
          </p>
        </div>

        <button 
          type="button" 
          onClick={fetchDashboardData} 
          className="btn btn-secondary btn-sm"
          title="Refresh metrics from PostgreSQL"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 5 Core Mandatory Metric Cards */}
      <div className="metrics-grid">
        {/* Metric 1: Total Projects */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Projects</span>
            <div className="metric-icon-box" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
              <FolderKanban size={18} />
            </div>
          </div>
          <div className="metric-value">{metrics.total_projects}</div>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Active portfolios</span>
        </div>

        {/* Metric 2: Total Tasks */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Tasks</span>
            <div className="metric-icon-box" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
              <CheckSquare size={18} />
            </div>
          </div>
          <div className="metric-value">{metrics.total_tasks}</div>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Across all projects</span>
        </div>

        {/* Metric 3: Completed Tasks */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Completed Tasks</span>
            <div className="metric-icon-box" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#15803d' }}>
            {metrics.completed_tasks}
          </div>
          <span style={{ fontSize: '12px', color: '#16a34a', marginTop: '6px', fontWeight: '500' }}>
            {metrics.completion_rate}% completion rate
          </span>
        </div>

        {/* Metric 4: Pending Tasks */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Pending Tasks</span>
            <div className="metric-icon-box" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#b45309' }}>
            {metrics.pending_tasks}
          </div>
          <span style={{ fontSize: '12px', color: '#b45309', marginTop: '6px' }}>
            To Do & In Progress
          </span>
        </div>

        {/* Metric 5: Overdue Tasks */}
        <div className="metric-card" style={{ borderColor: metrics.overdue_tasks > 0 ? '#fca5a5' : '#e2e8f0' }}>
          <div className="metric-header">
            <span className="metric-label" style={{ color: metrics.overdue_tasks > 0 ? '#b91c1c' : '#475569' }}>
              Overdue Tasks
            </span>
            <div className="metric-icon-box" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: metrics.overdue_tasks > 0 ? '#dc2626' : '#0f172a' }}>
            {metrics.overdue_tasks}
          </div>
          <span style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px', fontWeight: '600' }}>
            {metrics.overdue_tasks > 0 ? 'Requires attention' : 'All deadlines on track'}
          </span>
        </div>
      </div>

      {/* Overdue Task Notification Banner (Bonus Criterion) */}
      {overdueAlerts && overdueAlerts.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#991b1b' }}>
                  Urgent Attention: Overdue Tasks Detected ({metrics.overdue_tasks})
                </h3>
                <p style={{ fontSize: '13px', color: '#7f1d1d' }}>
                  The following tasks have passed their target deadlines without completion.
                </p>
              </div>
            </div>

            <Link to="/tasks?overdue=true" className="btn btn-danger btn-sm">
              <span>View All Overdue</span>
              <ArrowRight size={14} />
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
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{task.title}</td>
                    <td>{task.project_name}</td>
                    <td>{task.assignee_name || 'Unassigned'}</td>
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
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              Real-time completion percentage based on task status resolution.
            </p>
          </div>
          <Link to="/projects" className="btn btn-secondary btn-sm">
            <span>Manage Projects</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {projectSummaries.map((proj) => (
            <div key={proj.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                  {proj.name}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
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
