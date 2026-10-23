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
  X
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';

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
      setTasks(data.tasks);
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
          setProjects(projRes.projects);
          setUsers(usersRes.users);
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
          setTasks(data.tasks);
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

  return (
    <div>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
            Tasks & Workflow Board
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Filter by project, priority, assignee, and track deadlines.
          </p>
        </div>

        {isAdmin && (
          <button 
            type="button" 
            onClick={handleOpenCreateModal} 
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Create New Task</span>
          </button>
        )}
      </div>

      {/* Multi-Field Filter Bar (Mandatory Requirement #6) */}
      <div className="filter-bar">
        {/* Live Search */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search tasks by title or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Project Filter */}
        <select
          className="select-field"
          style={{ width: 'auto', minWidth: '160px' }}
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
          className="select-field"
          style={{ width: 'auto', minWidth: '130px' }}
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
          className="select-field"
          style={{ width: 'auto', minWidth: '130px' }}
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
          className="select-field"
          style={{ width: 'auto', minWidth: '150px' }}
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
          className={`btn btn-sm ${isOverdueOnly ? 'btn-danger' : 'btn-secondary'}`}
          style={{ height: '38px' }}
        >
          <AlertTriangle size={15} />
          <span>{isOverdueOnly ? 'Overdue Active' : 'Overdue Only'}</span>
        </button>

        {/* Reset Filter Button */}
        {(search || selectedProject || selectedStatus || selectedPriority || selectedAssignee || isOverdueOnly) && (
          <button
            type="button"
            onClick={resetFilters}
            className="btn btn-secondary btn-sm"
            title="Clear all filters"
            style={{ height: '38px' }}
          >
            <X size={15} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {error && (
        <div className="alert-banner">
          <AlertTriangle size={20} color="#b91c1c" />
          <div className="alert-desc">{error}</div>
        </div>
      )}

      {/* Task List Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Deadline</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid #cbd5e1',
                      borderTopColor: '#0a1931',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>Filtering tasks...</span>
                  </div>
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No tasks found matching your filter criteria.
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const isAssignedToMe = task.assignee_id === user?.id;
                const canModify = isAdmin || isAssignedToMe;

                return (
                  <tr key={task.id}>
                    <td>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>{task.title}</div>
                      {task.description && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', maxWidth: '300px' }}>
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>
                        {task.project_name}
                      </span>
                    </td>
                    <td>
                      <Badge type="status" value={task.status} />
                    </td>
                    <td>
                      <Badge type="priority" value={task.priority} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: '#18181b',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {task.assignee_name ? task.assignee_name[0] : '?'}
                        </div>
                        <span style={{ fontSize: '13px' }}>
                          {task.assignee_name || <em style={{ color: '#94a3b8' }}>Unassigned</em>}
                        </span>
                      </div>
                    </td>
                    <td>
                      {task.is_overdue ? (
                        <Badge isOverdue={true} value={task.due_date} />
                      ) : (
                        <span style={{ fontSize: '13px', color: '#475569' }}>
                          {task.due_date || 'No deadline'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {canModify && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(task)}
                            className="btn btn-secondary btn-sm"
                            title={isAdmin ? 'Edit task details' : 'Update status'}
                            style={{ padding: '6px' }}
                          >
                            <Edit3 size={15} />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(task)}
                            className="btn btn-danger btn-sm"
                            title="Delete task"
                            style={{ padding: '6px' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            padding: '10px 14px',
            borderRadius: '6px',
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
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Task:</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                  {currentTask?.title}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="statusUpdate">Update Status</label>
                <select
                  id="statusUpdate"
                  className="select-field"
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
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
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
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
          <p style={{ fontSize: '14px', color: '#475569' }}>
            Are you sure you want to delete task <strong>"{deleteTarget?.title}"</strong>?
          </p>
          <div className="modal-footer" style={{ margin: '-24px -24px -24px -24px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteTask}
              className="btn btn-danger"
            >
              Yes, Delete Task
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
