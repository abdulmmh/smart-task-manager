import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';
import { tasksApi } from '../api/tasksApi';
import { authApi } from '../api/authApi';
import { projectsApi } from '../api/projectsApi';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  Flame,
  Check,
  Paperclip,
  Calendar,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { getProjectTheme, getUserTheme } from '../utils/projectTheme';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'pending'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const fetchAllData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const [dashRes, tasksRes, usersRes, projRes] = await Promise.all([
        dashboardApi.getMetrics(),
        tasksApi.getTasks(),
        authApi.getUsers().catch(() => ({ users: [] })),
        projectsApi.getProjects().catch(() => ({ projects: [] })),
      ]);

      setData(dashRes);
      setTasks(tasksRes.tasks || []);
      setUsers(usersRes.users || []);
      setProjects(projRes.projects || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      dashboardApi.getMetrics(),
      tasksApi.getTasks(),
      authApi.getUsers().catch(() => ({ users: [] })),
        projectsApi.getProjects().catch(() => ({ projects: [] })),
    ])
      .then(([dashRes, tasksRes, usersRes, projRes]) => {
        if (isMounted) {
          setData(dashRes);
          setTasks(tasksRes.tasks || []);
          setUsers(usersRes.users || []);
          setProjects(projRes.projects || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to load dashboard data.');
          setIsLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, []);

  // Quick toggle task completion directly from the BrightMind checklist
  const handleToggleTaskStatus = async (task) => {
    try {
      const nextStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
      await tasksApi.updateTask(task.id, { status: nextStatus });
      setActionNotice(`Task "${task.title}" updated to ${nextStatus}.`);
      setTimeout(() => setActionNotice(''), 3000);
      fetchAllData(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task.');
    }
  };

  const { metrics, overdueAlerts = [] } = data || {};
  const isAdmin = user?.role === 'admin';
  const [selectedAdminProjectId, setSelectedAdminProjectId] = useState('');

  // Helper to determine if a task is overdue
  const isTaskOverdue = useCallback((task) => {
    if (!task) return false;
    const status = String(task.status || '').trim().toLowerCase();
    if (status === 'completed') return false;
    if (task.is_overdue !== undefined && task.is_overdue !== null) {
      return Boolean(task.is_overdue);
    }
    if (!task.due_date) return false;
    const due = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }, []);

  // Tasks strictly assigned to current user
  const myTasks = useMemo(() => {
    return tasks.filter((t) => String(t.assignee_id) === String(user?.id));
  }, [tasks, user]);

  // Tasks filtered for the left "My Tasks" section
  const displayedTasks = tasks.filter((t) => {
    if (activeTab === 'active') {
      return t.status !== 'Completed';
    }
    return t.status === 'To Do' || (t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completed');
  });

  // Member's primary project and personal milestone progress
  const memberProject = useMemo(() => {
    if (isAdmin) return null;
    const projectTaskCounts = {};
    myTasks.forEach((t) => {
      if (t.project_id) {
        projectTaskCounts[t.project_id] = (projectTaskCounts[t.project_id] || 0) + 1;
      }
    });

    const sortedIds = Object.keys(projectTaskCounts).sort(
      (a, b) => projectTaskCounts[b] - projectTaskCounts[a]
    );
    const primaryId = sortedIds[0] || projects[0]?.id;
    if (!primaryId) return null;

    const baseProj = projects.find((p) => String(p.id) === String(primaryId)) || {
      id: primaryId,
      name: myTasks[0]?.project_name || 'Assigned Initiative',
      description: 'Active enterprise initiative tracking deliverables assigned to your role.',
      progress_percentage: 0,
    };

    const myProjTasks = myTasks.filter((t) => String(t.project_id) === String(primaryId));
    const myCompleted = myProjTasks.filter((t) => String(t.status || '').trim().toLowerCase() === 'completed').length;
    const myTotal = myProjTasks.length;
    const myProgress = myTotal > 0 ? Math.round((myCompleted / myTotal) * 100) : 0;

    // Teammates in this project
    const allProjTasks = tasks.filter((t) => String(t.project_id) === String(primaryId));
    const uniqueAssigneeIds = Array.from(new Set(allProjTasks.map((t) => t.assignee_id).filter(Boolean)));
    const teamMembers = users.filter((u) => uniqueAssigneeIds.includes(u.id));

    // Next upcoming due date for this member in this project
    const activeTasks = myProjTasks.filter((t) => String(t.status || '').trim().toLowerCase() !== 'completed' && t.due_date);
    const nextDueTask = activeTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];

    return {
      ...baseProj,
      myCompleted,
      myTotal,
      myProgress,
      teamMembers,
      nextDueDate: nextDueTask ? nextDueTask.due_date : null,
    };
  }, [isAdmin, myTasks, projects, tasks, users]);

  // Admin's selected/featured project
  const adminProject = useMemo(() => {
    if (!isAdmin) return null;
    if (selectedAdminProjectId) {
      const found = projects.find((p) => String(p.id) === String(selectedAdminProjectId));
      if (found) return found;
    }
    const withOverdue = projects.find((p) => (p.overdue_tasks || 0) > 0);
    if (withOverdue) return withOverdue;
    return projects[0] || {
      id: 'default',
      name: 'Enterprise Portfolio',
      description: 'Active enterprise initiative tracking deliverables, milestones, and real-time execution.',
      progress_percentage: metrics?.completion_rate || 0,
      total_tasks: metrics?.total_tasks || 0,
    };
  }, [isAdmin, selectedAdminProjectId, projects, metrics]);

  // Assignees for admin's featured project
  const adminProjectAssignees = useMemo(() => {
    if (!adminProject?.id) return users.slice(0, 3);
    const projTasks = tasks.filter((t) => String(t.project_id) === String(adminProject.id));
    const uniqueIds = Array.from(new Set(projTasks.map((t) => t.assignee_id).filter(Boolean)));
    const assignees = users.filter((u) => uniqueIds.includes(u.id));
    return assignees.length > 0 ? assignees : users.slice(0, 3);
  }, [adminProject, tasks, users]);

  // Admin project next deliverable timeline
  const adminProjectTimeline = useMemo(() => {
    if (!adminProject?.id) return overdueAlerts[0]?.due_date || 'Nov 12, 2026';
    const projTasks = tasks.filter((t) => String(t.project_id) === String(adminProject.id) && String(t.status || '').trim().toLowerCase() !== 'completed' && t.due_date);
    if (projTasks.length === 0) return 'All deliverables on schedule';
    const sorted = projTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    return sorted[0].due_date;
  }, [adminProject, tasks, overdueAlerts]);

  // Member's checklist tasks (their own tasks, sorted by overdue -> in-progress -> to-do -> completed)
  const memberChecklistTasks = useMemo(() => {
    return [...myTasks].sort((a, b) => {
      const aOverdue = isTaskOverdue(a);
      const bOverdue = isTaskOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      const aDone = a.status === 'Completed';
      const bDone = b.status === 'Completed';
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      return 0;
    }).slice(0, 6);
  }, [myTasks, isTaskOverdue]);

  const memberOverdueCount = useMemo(() => {
    return myTasks.filter(isTaskOverdue).length;
  }, [myTasks, isTaskOverdue]);

  // Admin's checklist tasks (Team Action Items: Overdue first, then High Priority in-progress)
  const adminChecklistTasks = useMemo(() => {
    const list = [...tasks].sort((a, b) => {
      const aOverdue = isTaskOverdue(a);
      const bOverdue = isTaskOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (a.priority === 'High' && b.priority !== 'High') return -1;
      if (a.priority !== 'High' && b.priority === 'High') return 1;
      const aDone = a.status === 'Completed';
      const bDone = b.status === 'Completed';
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      return 0;
    });
    return list.slice(0, 6);
  }, [tasks, isTaskOverdue]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <RefreshCw className="animate-spin" size={28} color="var(--primary)" />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>Loading BrightMind Workspace...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="alert-banner">
        <AlertCircle size={20} color="var(--danger)" />
        <div>
          <div className="alert-title">System Alert</div>
          <div className="alert-desc">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {actionNotice && (
        <div style={{
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success)',
          border: '1px solid var(--success-border)',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main BrightMind 2-Column Dashboard Grid */}
      <div className="pro-dashboard-layout">
        
        {/* Left / Main Workspace Column */}
        <div className="pro-main-col">
          
          {/* Section 1: Project Summary (Hero Cards) */}
          <div>
            <div className="pro-section-header">
              <h2 className="pro-section-title">Project Summary</h2>
              <Link to="/projects" className="pro-section-link">
                <span>See all Project</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="pro-hero-grid">
              
              {/* Card 1: In progress Project (Vibrant Blue Card with Wave) */}
              <div className="pro-card-blue">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="pro-glass-tile">
                    <Clock size={18} strokeWidth={2.4} />
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '0.5px', opacity: 0.85, textTransform: 'uppercase' }}>
                    Active
                  </span>
                </div>

                {/* Elegant Smooth Sparkline Wave */}
                <div className="pro-sparkline-box">
                  <svg viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                    <defs>
                      <linearGradient id="waveBlueGrad" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ffffff" stopOpacity="0.25" />
                        <stop offset="1" stopColor="#ffffff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M 0,26 C 22,26 32,8 55,14 C 75,19 90,32 110,18 C 124,8 132,20 140,15 L 140,40 L 0,40 Z" 
                      fill="url(#waveBlueGrad)" 
                    />
                    <path 
                      d="M 0,26 C 22,26 32,8 55,14 C 75,19 90,32 110,18 C 124,8 132,20 140,15" 
                      stroke="#ffffff" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </div>

                <div>
                  <div className="pro-hero-value">{metrics?.pending_tasks || 0}</div>
                  <div className="pro-hero-label">In progress Tasks</div>
                </div>
              </div>

              {/* Card 2: Completed Project (Midnight Slate Card with Wave) */}
              <div className="pro-card-dark">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="pro-glass-tile">
                    <CheckSquare size={18} strokeWidth={2.4} />
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', letterSpacing: '0.5px', opacity: 0.85, textTransform: 'uppercase' }}>
                    Done
                  </span>
                </div>

                {/* Elegant Smooth Sparkline Wave */}
                <div className="pro-sparkline-box">
                  <svg viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                    <defs>
                      <linearGradient id="waveDarkGrad" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#ffffff" stopOpacity="0.22" />
                        <stop offset="1" stopColor="#ffffff" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M 0,22 C 25,22 35,30 58,16 C 80,4 95,24 115,12 C 126,6 134,16 140,10 L 140,40 L 0,40 Z" 
                      fill="url(#waveDarkGrad)" 
                    />
                    <path 
                      d="M 0,22 C 25,22 35,30 58,16 C 80,4 95,24 115,12 C 126,6 134,16 140,10" 
                      stroke="#ffffff" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </div>

                <div>
                  <div className="pro-hero-value">{metrics?.completed_tasks || 0}</div>
                  <div className="pro-hero-label">Completed Tasks</div>
                </div>
              </div>

              {/* Card 3: Teams Member & Working time (Clean White Card) */}
              <div className="pro-card-white">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)' }}>
                      Teams Member
                    </span>
                  </div>

                  {/* Stacked Circular Avatars */}
                  <div className="team-avatar-stack">
                    {users.slice(0, 4).map((u) => (
                      <div 
                        key={u.id} 
                        className={`avatar-chip tone-${getUserTheme(u.id, users)}`}
                        title={`${u.name} (${u.role})`}
                      >
                        {getInitials(u.name)}
                      </div>
                    ))}
                    {users.length > 4 && (
                      <div className="team-avatar-count">+{users.length - 4}</div>
                    )}
                  </div>
                </div>

                {/* Donut Progress Gauge */}
                <div className="gauge-wrapper">
                  <svg className="donut-gauge" viewBox="0 0 54 54">
                    <circle className="donut-bg" cx="27" cy="27" r="21" />
                    <circle 
                      className="donut-fill" 
                      cx="27" 
                      cy="27" 
                      r="21" 
                      strokeDasharray={132}
                      strokeDashoffset={132 - (132 * (metrics?.completion_rate || 0)) / 100}
                    />
                  </svg>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Velocity Rate</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                      {metrics?.completion_rate || 0}%
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: "My Tasks" (Interactive Card-based Rows) */}
          <div className="pro-tasks-container">
            <div className="pro-tabs-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  My Tasks
                </h3>
                <div className="pro-tabs-pills">
                  <button 
                    type="button" 
                    className={`pro-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                  >
                    Active Task
                  </button>
                  <button 
                    type="button" 
                    className={`pro-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                  >
                    Pending
                  </button>
                </div>
              </div>

              {user?.role === 'admin' ? (
                <button 
                  type="button" 
                  onClick={() => navigate('/tasks')} 
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: 'var(--radius-pill)', gap: '6px' }}
                >
                  <Plus size={15} />
                  <span>Create</span>
                </button>
              ) : null}
            </div>

            {/* Task Card List */}
            {displayedTasks.length === 0 ? (
              <div style={{ background: '#FFFFFF', padding: '36px', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
                No tasks currently in this view.
              </div>
            ) : (
              displayedTasks.slice(0, 5).map((t) => {
                const projectInitial = (t.project_name || 'B').charAt(0).toUpperCase();
                const progressPct = t.status === 'Completed' ? 100 : t.status === 'In Progress' ? 60 : 15;

                return (
                  <div key={t.id} className="pro-task-row">
                    <div className="pro-task-left">
                      <div 
                        className={`pro-app-badge tone-${getProjectTheme(t.project_id, projects)}`}
                      >
                        {projectInitial}
                      </div>
                      <div className="pro-task-meta">
                        <div className="pro-task-title" title={t.title}>{t.title}</div>
                        <div className="pro-task-chips">
                          <span className="pro-task-chip-item" title={t.project_name || 'Project'}>
                            <Paperclip size={12} />
                            <span className="pro-task-project-name">{t.project_name || 'Project'}</span>
                          </span>
                          {t.due_date && (
                            <span className="pro-task-chip-item">
                              <Calendar size={12} />
                              <span>{t.due_date}</span>
                            </span>
                          )}
                          <span className="pro-task-chip-item">
                            <Badge type="priority" value={t.priority} />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pro-task-right">
                      <div className="pro-progress-box">
                        <span className="pro-progress-text">Progress {progressPct}%</span>
                        <div className="pro-progress-bar">
                          <div 
                            className="pro-progress-fill" 
                            style={{ 
                              width: `${progressPct}%`,
                              backgroundColor: t.status === 'Completed' ? 'var(--success)' : 'var(--primary)' 
                            }} 
                          />
                        </div>
                      </div>

                      <div onClick={() => handleToggleTaskStatus(t)} style={{ cursor: 'pointer' }} title="Click to toggle status">
                        <Badge type="status" value={t.status} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <Link to="/tasks" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', textDecoration: 'none' }}>
                View All {tasks.length} Tasks in Workflow →
              </Link>
            </div>
          </div>

        </div>

        {/* Right Inspector Column (Role-Based Project & Tasks) */}
        <div className="pro-side-col">
          
          {/* Card 1: Role-Based Project Snapshot */}
          <div className="inspector-card">
            <div className="inspector-header">
              <span className="inspector-title">
                {isAdmin ? 'Project Snapshot' : 'My Active Project'}
              </span>
              {isAdmin ? (
                projects.length > 1 ? (
                  <select
                    value={adminProject?.id || ''}
                    onChange={(e) => setSelectedAdminProjectId(e.target.value)}
                    className="inspector-project-select"
                    title="Switch project spotlight"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="inspector-role-badge admin">
                    <ShieldCheck size={12} /> Lead View
                  </span>
                )
              ) : (
                <span className="inspector-role-badge member">
                  <UserCheck size={12} /> My Role
                </span>
              )}
            </div>

            <div className="priority-flame-pill">
              <Flame size={13} />
              <span>
                {isAdmin 
                  ? ((adminProject?.overdue_tasks || 0) > 0 ? `${adminProject.overdue_tasks} Overdue In Initiative` : 'Executive Initiative Spotlight')
                  : 'Assigned Initiative Deliverable'}
              </span>
            </div>

            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {isAdmin ? adminProject?.name : (memberProject?.name || 'No Project Assigned')}
              </h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {isAdmin 
                  ? (adminProject?.description || 'Active enterprise initiative tracking deliverables, milestones, and real-time execution.')
                  : (memberProject?.description || 'You are currently not assigned to any active project deliverables.')}
              </p>
            </div>

            <div>
              <div className="inspector-meta-row">
                <span className="inspector-meta-label">
                  <Clock size={14} />
                  <span>Status</span>
                </span>
                <span className="inspector-meta-val" style={{ color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: '11.5px' }}>
                  {isAdmin 
                    ? (adminProject?.progress_percentage === 100 ? 'Completed' : 'In Progress')
                    : (memberProject?.myTotal > 0 ? (memberProject.myCompleted === memberProject.myTotal ? 'Completed' : 'In Progress') : 'Active')}
                </span>
              </div>

              <div className="inspector-meta-row">
                <span className="inspector-meta-label">
                  <Calendar size={14} />
                  <span>{isAdmin ? 'Timeline' : 'Next Due'}</span>
                </span>
                <span className="inspector-meta-val">
                  {isAdmin ? adminProjectTimeline : (memberProject?.nextDueDate || 'On Schedule')}
                </span>
              </div>

              <div className="inspector-meta-row">
                <span className="inspector-meta-label">
                  <FolderKanban size={14} />
                  <span>{isAdmin ? 'Assignees' : 'Teammates'}</span>
                </span>
                <div className="team-avatar-stack">
                  {(isAdmin ? adminProjectAssignees : (memberProject?.teamMembers || [user])).slice(0, 3).map((u) => (
                    <div 
                      key={u.id} 
                      className={`avatar-chip tone-${getUserTheme(u.id, users)}`}
                      title={u.name}
                    >
                      {getInitials(u.name)}
                    </div>
                  ))}
                  {(isAdmin ? adminProjectAssignees.length : (memberProject?.teamMembers || []).length) > 3 && (
                    <div className="avatar-chip tone-neutral" title="More team members">
                      +{(isAdmin ? adminProjectAssignees.length : memberProject.teamMembers.length) - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                <span>{isAdmin ? 'Milestone Progress' : 'My Deliverables Progress'}</span>
                <span style={{ color: 'var(--primary)' }}>
                  {isAdmin ? `${adminProject?.progress_percentage || 0}%` : `${memberProject?.myProgress || 0}%`}
                </span>
              </div>
              <div className="pro-progress-bar" style={{ height: '7px' }}>
                <div 
                  className="pro-progress-fill" 
                  style={{ 
                    width: `${isAdmin ? (adminProject?.progress_percentage || 0) : (memberProject?.myProgress || 0)}%`,
                    background: (isAdmin ? adminProject?.progress_percentage : memberProject?.myProgress) === 100
                      ? 'linear-gradient(90deg, #10B981, #059669)'
                      : 'var(--primary-gradient)'
                  }} 
                />
              </div>
              {!isAdmin && memberProject?.myTotal > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                  {memberProject.myCompleted} of {memberProject.myTotal} tasks completed
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Role-Based Today Tasks Checklist */}
          <div className="inspector-card">
            <div className="inspector-header">
              <span className="inspector-title">
                {isAdmin ? 'Team Action Items' : 'My Daily Tasks'}
              </span>
              <span className={`inspector-role-badge ${isAdmin ? 'admin' : 'member'}`}>
                {isAdmin ? 'Team Focus' : `${myTasks.length} Assigned`}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(isAdmin ? adminChecklistTasks : memberChecklistTasks).length === 0 ? (
                <div className="checklist-empty-box">
                  <CheckCircle2 size={24} color="var(--success)" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                  {isAdmin 
                    ? 'No urgent team tasks right now. Great workflow!' 
                    : "You're all caught up! No active tasks assigned to you right now."}
                </div>
              ) : (
                (isAdmin ? adminChecklistTasks : memberChecklistTasks).map((t) => {
                  const isDone = t.status === 'Completed';
                  const isOverdue = isTaskOverdue(t);

                  return (
                    <div 
                      key={t.id} 
                      className={`checklist-item ${isDone ? 'done' : ''}`}
                      onClick={() => handleToggleTaskStatus(t)}
                      title="Click to toggle completion status"
                    >
                      <div className="checklist-item-left">
                        <div className="checklist-circle">
                          {isDone && <Check size={11} strokeWidth={3} />}
                        </div>
                        <span className="checklist-text" title={t.title}>
                          {t.title}
                        </span>
                      </div>

                      <div className="checklist-item-right">
                        {/* Admin sees assignee initials chip */}
                        {isAdmin && t.assignee_name && (
                          <div 
                            className={`checklist-assignee-chip tone-${getUserTheme(t.assignee_id, users)}`}
                            title={`Assigned to: ${t.assignee_name}`}
                          >
                            {getInitials(t.assignee_name)}
                          </div>
                        )}
                        {isOverdue && !isDone ? (
                          <span style={{ fontSize: '10.5px', color: '#DC2626', background: '#FEE2E2', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                            Overdue
                          </span>
                        ) : (
                          <Badge type="priority" value={t.priority} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Overdue Alert Banner */}
            {isAdmin ? (
              overdueAlerts.length > 0 && (
                <div style={{
                  marginTop: '6px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Flame size={15} color="var(--danger)" />
                  <span style={{ fontSize: '11.5px', color: 'var(--danger)', fontWeight: '700' }}>
                    {overdueAlerts.length} overdue task{overdueAlerts.length > 1 ? 's' : ''} across team require attention
                  </span>
                </div>
              )
            ) : (
              memberOverdueCount > 0 && (
                <div style={{
                  marginTop: '6px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Flame size={15} color="var(--danger)" />
                  <span style={{ fontSize: '11.5px', color: 'var(--danger)', fontWeight: '700' }}>
                    {memberOverdueCount} of your assigned tasks require urgent completion!
                  </span>
                </div>
              )
            )}

            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <Link 
                to={isAdmin ? '/tasks' : `/tasks?assigneeId=${user?.id || ''}`} 
                style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', textDecoration: 'none' }}
              >
                {isAdmin ? 'View All Team Tasks in Workflow →' : 'View All My Tasks in Workflow →'}
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
