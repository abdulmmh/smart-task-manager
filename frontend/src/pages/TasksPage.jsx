import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tasksApi } from '../api/tasksApi';
import { projectsApi } from '../api/projectsApi';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  X,
  CheckSquare,
  Clock,
  Sparkles,
  FolderKanban
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { getProjectTheme } from '../utils/projectTheme';
import { getAvatarTone } from '../utils/avatarUtils';

export default function TasksPage() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [selectedProject, setSelectedProject] = useState(searchParams.get('projectId') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [selectedPriority, setSelectedPriority] = useState(searchParams.get('priority') || '');
  const [selectedAssignee, setSelectedAssignee] = useState(searchParams.get('assigneeId') || '');
  const [isOverdueOnly, setIsOverdueOnly] = useState(searchParams.get('overdue') === 'true');

  // Synchronize when URL search param changes externally (e.g. from Topbar search or Notifications)
  const urlSearchParam = searchParams.get('search') || '';
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearchParam);

  if (urlSearchParam !== prevUrlSearch) {
    setPrevUrlSearch(urlSearchParam);
    setSearch(urlSearchParam);
    setDebouncedSearch(urlSearchParam);
  }

  // Synchronize projectId when navigated from ProjectsPage or URL query
  const urlProjectId = searchParams.get('projectId') || '';
  const [prevUrlProjectId, setPrevUrlProjectId] = useState(urlProjectId);

  if (urlProjectId !== prevUrlProjectId) {
    setPrevUrlProjectId(urlProjectId);
    setSelectedProject(urlProjectId);
  }

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Synchronize active filters with URL query parameters
  useEffect(() => {
    const params = {};
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (selectedProject) params.projectId = selectedProject;
    if (selectedStatus) params.status = selectedStatus;
    if (selectedPriority) params.priority = selectedPriority;
    if (selectedAssignee) params.assigneeId = selectedAssignee;
    if (isOverdueOnly) params.overdue = 'true';
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedProject, selectedStatus, selectedPriority, selectedAssignee, isOverdueOnly, setSearchParams]);

  // Task Modal State (Admin create/edit or Member status update)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'status-only'
  const [currentTask, setCurrentTask] = useState(null);

  // Form Fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState('To Do');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const filters = {
        search: debouncedSearch.trim() || undefined,
        projectId: selectedProject || undefined,
        status: selectedStatus || undefined,
        priority: selectedPriority || undefined,
        assigneeId: selectedAssignee || undefined,
        overdue: isOverdueOnly || undefined,
      };

      const data = await tasksApi.getTasks(filters);
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tasks.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedProject, selectedStatus, selectedPriority, selectedAssignee, isOverdueOnly]);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([projectsApi.getProjects(), authApi.getUsers()])
      .then(([projRes, usersRes]) => {
        if (isCurrent) {
          setProjects(projRes.projects || []);
          setUsers(usersRes.users || []);
        }
      })
      .catch((err) => {
        console.error('Error fetching filter lists:', err);
      });
    return () => { isCurrent = false; };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const filters = {
      search: debouncedSearch.trim() || undefined,
      projectId: selectedProject || undefined,
      status: selectedStatus || undefined,
      priority: selectedPriority || undefined,
      assigneeId: selectedAssignee || undefined,
      overdue: isOverdueOnly || undefined,
    };

    tasksApi.getTasks(filters)
      .then((data) => {
        if (isCurrent) {
          setTasks(data.tasks || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          setError(err.response?.data?.error || 'Failed to load tasks.');
          setIsLoading(false);
        }
      });

    return () => { isCurrent = false; };
  }, [debouncedSearch, selectedProject, selectedStatus, selectedPriority, selectedAssignee, isOverdueOnly]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setTaskTitle('');
    setTaskDesc('');
    setTaskStatus('To Do');
    setTaskPriority('Medium');
    setTaskDueDate('');
    setTaskProjectId(projects[0]?.id || '');
    setTaskAssigneeId('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setCurrentTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskDueDate(task.due_date || '');
    setTaskProjectId(task.project_id);
    setTaskAssigneeId(task.assignee_id || '');
    setFormError('');

    if (isAdmin) {
      setModalMode('edit');
    } else {
      setModalMode('status-only');
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (modalMode === 'status-only') {
      setIsSubmitting(true);
      try {
        await tasksApi.updateTask(currentTask.id, { status: taskStatus });
        setIsModalOpen(false);
        fetchTasks();
      } catch (err) {
        setFormError(err.response?.data?.error || 'Failed to update task status.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!taskTitle.trim()) {
      setFormError('Task title is required.');
      return;
    }

    if (!taskProjectId) {
      setFormError('Please select a project.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: taskTitle.trim(),
        description: taskDesc.trim() || null,
        status: taskStatus,
        priority: taskPriority,
        due_date: taskDueDate || null,
        project_id: taskProjectId,
        assignee_id: taskAssigneeId || null,
      };

      if (modalMode === 'create') {
        await tasksApi.createTask(payload);
      } else {
        await tasksApi.updateTask(currentTask.id, payload);
      }

      setIsModalOpen(false);
      fetchTasks();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    try {
      await tasksApi.deleteTask(deleteTarget.id);
      setDeleteTarget(null);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task.');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedProject('');
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedAssignee('');
    setIsOverdueOnly(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const hasActiveFilters = Boolean(
    search || selectedProject || selectedStatus || selectedPriority || selectedAssignee || isOverdueOnly
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="pro-pill-badge">
              <CheckSquare size={13} />
              <span>Deliverables & Tasks</span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
              • {tasks.length} Tasks Matching Filters
            </span>
          </div>
          <h1 className="pro-heading">Tasks & Workflow Board</h1>
          <p className="pro-subheading">
            Filter by project, priority, assignee, and track deadlines across teams.
          </p>
        </div>

        <div>
          {isAdmin ? (
            <button 
              type="button" 
              onClick={handleOpenCreateModal} 
              className="btn-pro-primary"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create New Task</span>
            </button>
          ) : (
            <span style={{
              fontSize: '12.5px',
              color: 'var(--text-muted)',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Sparkles size={13} color="var(--primary)" />
              <span>Team Member (Status Updates Allowed)</span>
            </span>
          )}
        </div>
      </div>

      {/* Multi-Field Floating Filter Bar */}
      <div className="pro-filter-card">
        {/* Live Search */}
        <div className="search-input-wrapper" style={{ minWidth: '220px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ borderRadius: 'var(--radius-pill)', height: '38px', background: '#F8FAFC' }}
          />
        </div>

        {/* Project Filter */}
        <select
          className="pill-select"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          className="pill-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        {/* Priority Filter */}
        <select
          className="pill-select"
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Assignee Filter */}
        <select
          className="pill-select"
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
        >
          <option value="">All Assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>

        {/* Overdue Quick Filter Button */}
        <button
          type="button"
          onClick={() => setIsOverdueOnly(!isOverdueOnly)}
          className={`btn-pro-secondary ${isOverdueOnly ? 'pro-stat-chip overdue' : ''}`}
          style={{
            height: '38px',
            backgroundColor: isOverdueOnly ? '#FEF2F2' : '#FFFFFF',
            borderColor: isOverdueOnly ? '#FECACA' : '#E2E8F0',
            color: isOverdueOnly ? '#DC2626' : 'var(--text-secondary)'
          }}
        >
          <AlertTriangle size={14} />
          <span>{isOverdueOnly ? 'Overdue Active' : 'Overdue Only'}</span>
        </button>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="btn-pro-secondary"
            title="Clear all filters"
            style={{ height: '38px', color: 'var(--text-muted)' }}
          >
            <X size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {error && (
        <div className="alert-banner">
          <AlertTriangle size={20} color="var(--danger)" />
          <div className="alert-desc">{error}</div>
        </div>
      )}

      {/* Responsive Task List (grid rows on desktop, stacked cards on tablet/mobile) */}
      <div className="pro-table-wrapper">
        <div className="task-grid-head">
          <div>Task & Details</div>
          <div>Project</div>
          <div>Status</div>
          <div>Priority</div>
          <div>Assignee</div>
          <div>Deadline</div>
          <div className="task-col-actions">Actions</div>
        </div>

        {isLoading ? (
          <div className="task-empty-state">
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #E2E8F0',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-muted)' }}>Filtering BrightMind tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="task-empty-state">
            <CheckSquare size={32} color="var(--text-light)" />
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy-dark)' }}>No tasks match your criteria</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Try clearing your search filters or create a new task.</span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="btn-pro-secondary"
                style={{ marginTop: '8px' }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          tasks.map((task) => {
            const isAssignedToMe = task.assignee_id === user?.id;
            const canModify = isAdmin || isAssignedToMe;
            const projectInitial = (task.project_name || 'P').charAt(0).toUpperCase();
            const monogramTheme = getProjectTheme(task.project_id, projects);

            return (
              <div key={task.id} className="task-row">
                {/* Task Title & Details with Monogram */}
                <div className="task-cell task-cell-main">
                  <div
                    className={`project-monogram ${monogramTheme}`}
                    style={{ width: '38px', height: '38px', borderRadius: '11px', fontSize: '15px' }}
                  >
                    {projectInitial}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="task-title">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                  </div>
                </div>

                {/* Project Tag */}
                <div className="task-cell" data-label="Project">
                  <span className="task-project-tag" title={task.project_name}>
                    <FolderKanban size={12} color="var(--primary)" />
                    <span>{task.project_name}</span>
                  </span>
                </div>

                {/* Status */}
                <div className="task-cell" data-label="Status">
                  <Badge type="status" value={task.status} />
                </div>

                {/* Priority */}
                <div className="task-cell" data-label="Priority">
                  <Badge type="priority" value={task.priority} />
                </div>

                {/* Assignee */}
                <div className="task-cell" data-label="Assignee">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div className={`task-assignee-avatar tone-${getAvatarTone(task.assignee_name)}`}>{getInitials(task.assignee_name)}</div>
                    <span className="task-assignee-name">
                      {task.assignee_name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: '400' }}>Unassigned</span>}
                    </span>
                  </div>
                </div>

                {/* Deadline */}
                <div className="task-cell" data-label="Deadline">
                  {task.is_overdue ? (
                    <Badge isOverdue={true} value={task.due_date} />
                  ) : (
                    <span className="task-deadline">
                      <Clock size={13} color="var(--text-light)" />
                      <span>{task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}</span>
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="task-cell task-col-actions">
                  {canModify && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(task)}
                      className="pro-action-btn"
                      title={isAdmin ? 'Edit task details' : 'Update status'}
                    >
                      <Edit3 size={14} />
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(task)}
                      className="pro-action-btn pro-action-btn-danger"
                      title="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Modal (Create / Full Edit / Member Status Change) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === 'create'
            ? 'Create New Task'
            : modalMode === 'edit'
            ? 'Edit Task Details (Admin)'
            : 'Update Task Status'
        }
      >
        {formError && (
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            border: '1px solid var(--danger-border)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          {modalMode === 'status-only' ? (
            /* Member View: Only allowed to update status */
            <div>
              <div style={{ marginBottom: '16px', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: '12px', border: '1px solid #DBEAFE' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase' }}>Active Task</span>
                <div style={{ fontSize: '15.5px', fontWeight: '700', color: 'var(--navy-dark)', marginTop: '2px' }}>
                  {currentTask?.title}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="statusUpdate">Update Execution Status</label>
                <select
                  id="statusUpdate"
                  className="select-field"
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  style={{ borderRadius: '12px' }}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          ) : (
            /* Admin View: Full control */
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="taskTitle">Task Title *</label>
                <input
                  id="taskTitle"
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Implement OAuth login provider"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  style={{ borderRadius: '12px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="taskDesc">Description</label>
                <textarea
                  id="taskDesc"
                  rows={3}
                  className="input-field"
                  placeholder="Task instructions and requirements..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  style={{ borderRadius: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="taskProj">Project *</label>
                  <select
                    id="taskProj"
                    required
                    className="select-field"
                    value={taskProjectId}
                    onChange={(e) => setTaskProjectId(e.target.value)}
                    style={{ borderRadius: '12px' }}
                  >
                    <option value="" disabled>Select project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="taskAssignee">Assignee</label>
                  <select
                    id="taskAssignee"
                    className="select-field"
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    style={{ borderRadius: '12px' }}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="taskStatus">Status</label>
                  <select
                    id="taskStatus"
                    className="select-field"
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    style={{ borderRadius: '12px' }}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="taskPriority">Priority</label>
                  <select
                    id="taskPriority"
                    className="select-field"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    style={{ borderRadius: '12px' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="taskDueDate">Deadline</label>
                  <input
                    id="taskDueDate"
                    type="date"
                    className="input-field"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    style={{ borderRadius: '12px' }}
                  />
                </div>
              </div>
            </>
          )}

          <div className="modal-footer" style={{ margin: '-24px -24px -24px -24px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
              style={{ borderRadius: 'var(--radius-pill)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-pro-primary"
            >
              {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create Task' : 'Update Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Task Deletion"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Are you sure you want to delete task <strong>"{deleteTarget?.title}"</strong>?
          </p>
          <div className="modal-footer" style={{ margin: '-24px -24px -24px -24px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="btn btn-secondary"
              style={{ borderRadius: 'var(--radius-pill)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteTask}
              className="btn btn-danger"
              style={{ borderRadius: 'var(--radius-pill)' }}
            >
              Yes, Delete Task
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
