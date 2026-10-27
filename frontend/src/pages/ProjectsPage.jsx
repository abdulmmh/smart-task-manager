import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projectsApi';
import { tasksApi } from '../api/tasksApi';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  FolderKanban,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowRight,
  Users,
  CheckSquare
} from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { getProjectTheme } from '../utils/projectTheme';
import { getAvatarTone } from '../utils/avatarUtils';
import { useToast } from '../components/common/ToastContext';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Project Details Modal State (Clicking a card opens tasks & members under it)
  const [selectedDetailProject, setSelectedDetailProject] = useState(null);
  const [detailTasks, setDetailTasks] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentProject, setCurrentProject] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchProjects = useCallback(async () => {
    setError('');
    try {
      const [projData, tasksData] = await Promise.all([
        projectsApi.getProjects(),
        tasksApi.getTasks().catch(() => ({ tasks: [] })),
      ]);
      setProjects(projData.projects || []);
      setTasks(tasksData.tasks || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load projects.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      projectsApi.getProjects(),
      tasksApi.getTasks().catch(() => ({ tasks: [] })),
    ])
      .then(([projData, tasksData]) => {
        if (isMounted) {
          setProjects(projData.projects || []);
          setTasks(tasksData.tasks || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to load projects.');
          setIsLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setProjectName('');
    setProjectDesc('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj) => {
    setModalMode('edit');
    setCurrentProject(proj);
    setProjectName(proj.name);
    setProjectDesc(proj.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!projectName.trim()) {
      setFormError('Project name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (modalMode === 'create') {
        result = await projectsApi.createProject({ name: projectName.trim(), description: projectDesc.trim() });
      } else {
        result = await projectsApi.updateProject(currentProject.id, { name: projectName.trim(), description: projectDesc.trim() });
      }
      showToast({
        variant: 'success',
        title: modalMode === 'create' ? 'Project created' : 'Project updated',
        message: result.message || `Project ${modalMode === 'create' ? 'created' : 'updated'} successfully.`,
      });
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    try {
      const result = await projectsApi.deleteProject(deleteTarget.id);
      showToast({
        variant: 'success',
        title: 'Project deleted',
        message: result.message || 'Project deleted successfully.',
      });
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      showToast({
        variant: 'error',
        title: 'Could not delete project',
        message: err.response?.data?.error || 'Failed to delete project.',
      });
    }
  };

  const getMonogramLetter = (name) => {
    if (!name) return 'P';
    return name.trim().charAt(0).toUpperCase();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Open Project Details modal with immediate local tasks + fresh fetch from server
  const handleOpenDetailModal = async (proj) => {
    setSelectedDetailProject(proj);
    const local = tasks.filter((t) => String(t.project_id) === String(proj.id));
    setDetailTasks(local);
    setIsDetailLoading(true);
    try {
      const fresh = await projectsApi.getProjectById(proj.id);
      if (fresh.tasks) {
        setDetailTasks(fresh.tasks);
      }
    } catch {
      // Fallback to local
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Unique team members working on tasks under the selected detail project
  const detailAssignees = useMemo(() => {
    if (!selectedDetailProject) return [];
    const map = new Map();
    detailTasks.forEach((t) => {
      if (t.assignee_id && (t.assignee_name || t.assignee_email)) {
        if (!map.has(t.assignee_id)) {
          map.set(t.assignee_id, {
            id: t.assignee_id,
            name: t.assignee_name || t.assignee_email,
            email: t.assignee_email,
            taskCount: 1,
          });
        } else {
          map.get(t.assignee_id).taskCount += 1;
        }
      }
    });
    return Array.from(map.values());
  }, [selectedDetailProject, detailTasks]);

  // Helper to determine if a task is genuinely overdue (past deadline AND not completed)
  const isTaskOverdue = (task) => {
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
  };

  // Helper to normalize status for CSS classes
  const getTaskStatusKey = (status) => {
    const s = String(status || '').trim().toLowerCase();
    if (s === 'completed') return 'completed';
    if (s === 'in progress' || s === 'in_progress') return 'in-progress';
    return 'to-do';
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '55vh', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <RefreshCw className="animate-spin" size={28} color="var(--primary)" />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>Loading BrightMind Projects...</span>
        </div>
      </div>
    );
  }

  const completedCount = projects.filter((p) => p.progress_percentage === 100).length;
  const inProgressCount = projects.length - completedCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Page Header */}
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
              <FolderKanban size={13} />
              <span>Project Directory</span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
              • {projects.length} Total Initiatives ({completedCount} Completed, {inProgressCount} Active)
            </span>
          </div>
          <h1 className="pro-heading">Projects & Initiatives</h1>
          <p className="pro-subheading">
            Track company initiatives, team deliverable health, and milestones.
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
              <span>Create New Project</span>
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
              <span>Team Member View (Read-Only)</span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="alert-banner">
          <AlertTriangle size={20} color="var(--danger)" />
          <div className="alert-desc">{error}</div>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'var(--bg-subtle)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--navy-dark)' }}>No Projects Created Yet</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '360px' }}>
              {isAdmin ? 'Start by launching your first project initiative to begin assigning tasks to team members.' : 'There are currently no active projects available in the workspace.'}
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn-pro-primary"
              style={{ marginTop: '8px' }}
            >
              <Plus size={16} />
              <span>Create Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="project-cards-grid">
          {projects.map((proj) => {
            const projectTasks = tasks.filter((t) => String(t.project_id) === String(proj.id));
            const assigneeMap = new Map();
            projectTasks.forEach((t) => {
              if (t.assignee_id && (t.assignee_name || t.assignee_email)) {
                if (!assigneeMap.has(t.assignee_id)) {
                  assigneeMap.set(t.assignee_id, {
                    id: t.assignee_id,
                    name: t.assignee_name || t.assignee_email,
                    email: t.assignee_email,
                    taskCount: 1,
                  });
                } else {
                  assigneeMap.get(t.assignee_id).taskCount += 1;
                }
              }
            });
            const projectAssignees = Array.from(assigneeMap.values());

            return (
              <div
                key={proj.id}
                className="pro-project-card"
                onClick={() => handleOpenDetailModal(proj)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenDetailModal(proj);
                  }
                }}
              >

                {/* Card Header with Monogram & Actions */}
                <div>
                  <div className="project-card-header">
                    <div className="project-card-identity">
                      <div className={`project-monogram ${getProjectTheme(proj.id, projects)}`}>
                        {getMonogramLetter(proj.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="project-title-text" title={proj.name}>
                          {proj.name}
                        </h3>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          <span>{proj.total_tasks || 0} tasks tracked</span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(proj);
                          }}
                          className="pro-action-btn"
                          title="Edit project details"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(proj);
                          }}
                          className="pro-action-btn pro-action-btn-danger"
                          title="Delete project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="project-desc-text" style={{ marginTop: '16px' }}>
                    {proj.description || 'Enterprise initiative focused on deliverable quality, execution speed, and cross-team collaboration.'}
                  </p>
                </div>

                {/* Progress & Stat Footer */}
                <div>
                  {/* Progress Bar with Percentage */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>Progress</span>
                      <span style={{
                        fontWeight: '800',
                        color: proj.progress_percentage === 100 ? '#059669' : 'var(--primary)'
                      }}>
                        {proj.progress_percentage}%
                      </span>
                    </div>
                    <div className="progress-bar-bg" style={{ height: '7px' }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${proj.progress_percentage}%`,
                          background: proj.progress_percentage === 100
                            ? 'linear-gradient(90deg, #10B981, #059669)'
                            : 'var(--primary-gradient)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom Stats & Dynamic Assignee Stack */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '14px',
                    borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="pro-stat-chip done">
                        <CheckCircle2 size={12} /> {proj.completed_tasks} done
                      </span>
                      <span className="pro-stat-chip pending">
                        <Clock size={12} /> {proj.pending_tasks} pending
                      </span>
                      {proj.overdue_tasks > 0 && (
                        <span className="pro-stat-chip overdue">
                          <AlertTriangle size={12} /> {proj.overdue_tasks} overdue
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {projectAssignees.length > 0 ? (
                        <div
                          className="pro-avatar-stack"
                          title={`${projectAssignees.length} assigned member${projectAssignees.length > 1 ? 's' : ''}: ${projectAssignees.map((a) => a.name).join(', ')}`}
                        >
                          {projectAssignees.slice(0, 3).map((member) => (
                            <div
                              key={member.id}
                              className={`pro-avatar-stack-item tone-${getAvatarTone(member.name)}`}
                              title={`${member.name} (${member.taskCount} task${member.taskCount > 1 ? 's' : ''})`}
                            >
                              {getInitials(member.name)}
                            </div>
                          ))}
                          {projectAssignees.length > 3 && (
                            <div
                              className="pro-avatar-stack-item tone-neutral"
                              title={`+${projectAssignees.length - 3} more members`}
                            >
                              +{projectAssignees.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                          No assignees
                        </span>
                      )}

                      <div className="pro-card-view-hint">
                        <span>Details</span>
                        <ArrowRight size={13} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create New Project' : 'Edit Project Details'}
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
          <div className="form-group">
            <label className="form-label" htmlFor="projName">Project Name *</label>
            <input
              id="projName"
              type="text"
              required
              className="input-field"
              placeholder="e.g. Mobile Application API v2"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="projDesc">Description</label>
            <textarea
              id="projDesc"
              rows={4}
              className="input-field"
              placeholder="Explain project goals, deliverables, and scope..."
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              style={{ borderRadius: '12px' }}
            />
          </div>

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
              {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create Project' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Project Deletion"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?
          </p>
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: '12px',
            padding: '14px',
            fontSize: '13px',
            color: 'var(--danger)',
            lineHeight: 1.5
          }}>
            ⚠️ <strong>Cascading Delete:</strong> This will permanently delete all tasks associated with this project. This action cannot be undone.
          </div>
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
              onClick={handleDeleteProject}
              className="btn btn-danger"
              style={{ borderRadius: 'var(--radius-pill)' }}
            >
              Yes, Delete Project
            </button>
          </div>
        </div>
      </Modal>

      {/* Project Overview, Team & Tasks Details Modal */}
      {selectedDetailProject && (
        <Modal
          isOpen={!!selectedDetailProject}
          onClose={() => setSelectedDetailProject(null)}
          maxWidth="640px"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className={`project-monogram ${getProjectTheme(selectedDetailProject.id, projects)}`}
                style={{ width: '32px', height: '32px', fontSize: '13px' }}
              >
                {getMonogramLetter(selectedDetailProject.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--navy-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedDetailProject.name}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Project Overview & Deliverables
                </div>
              </div>
            </div>
          }
        >
          <div className="proj-detail-modal-body">
            {/* Description */}
            {selectedDetailProject.description && (
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {selectedDetailProject.description}
              </p>
            )}

            {/* Metrics Grid */}
            <div className="proj-detail-stats-grid">
              <div className="proj-detail-stat-tile">
                <div className="proj-detail-stat-num">{detailTasks.length}</div>
                <div className="proj-detail-stat-lbl">Total Tasks</div>
              </div>
              <div className="proj-detail-stat-tile" style={{ background: '#E7F8F0', borderColor: '#A7F3D0' }}>
                <div className="proj-detail-stat-num" style={{ color: '#059669' }}>
                  {detailTasks.filter((t) => String(t.status || '').trim().toLowerCase() === 'completed').length}
                </div>
                <div className="proj-detail-stat-lbl" style={{ color: '#047857' }}>Completed</div>
              </div>
              <div className="proj-detail-stat-tile" style={{ background: '#E8F0FE', borderColor: '#BFDBFE' }}>
                <div className="proj-detail-stat-num" style={{ color: '#2563EB' }}>
                  {detailTasks.filter((t) => {
                    const s = String(t.status || '').trim().toLowerCase();
                    return s === 'in progress' || s === 'in_progress';
                  }).length}
                </div>
                <div className="proj-detail-stat-lbl" style={{ color: '#1D4ED8' }}>In Progress</div>
              </div>
              <div className="proj-detail-stat-tile" style={{ background: '#FEF4DF', borderColor: '#FDE68A' }}>
                <div className="proj-detail-stat-num" style={{ color: '#D97706' }}>
                  {detailTasks.filter((t) => {
                    const s = String(t.status || '').trim().toLowerCase();
                    return s === 'to do' || s === 'todo' || s === 'pending';
                  }).length}
                </div>
                <div className="proj-detail-stat-lbl" style={{ color: '#B45309' }}>To Do</div>
              </div>
              <div
                className="proj-detail-stat-tile"
                style={{
                  background: detailTasks.filter(isTaskOverdue).length > 0 ? '#FDE9ED' : '#F8FAFC',
                  borderColor: detailTasks.filter(isTaskOverdue).length > 0 ? '#FECDD3' : '#E2E8F0'
                }}
              >
                <div
                  className="proj-detail-stat-num"
                  style={{ color: detailTasks.filter(isTaskOverdue).length > 0 ? '#E11D48' : 'var(--text-muted)' }}
                >
                  {detailTasks.filter(isTaskOverdue).length}
                </div>
                <div
                  className="proj-detail-stat-lbl"
                  style={{ color: detailTasks.filter(isTaskOverdue).length > 0 ? '#BE123C' : 'var(--text-muted)' }}
                >
                  Overdue
                </div>
              </div>
            </div>

            {/* Team Members Working on This Project */}
            <div>
              <div className="proj-modal-section-title">
                <Users size={16} color="var(--primary)" />
                <span>Team Members Working on this Project ({detailAssignees.length})</span>
              </div>
              {detailAssignees.length > 0 ? (
                <div className="proj-team-grid">
                  {detailAssignees.map((member) => (
                    <div key={member.id} className="proj-team-card">
                      <div className={`user-avatar-circle tone-${getAvatarTone(member.name)}`}>
                        {getInitials(member.name)}
                      </div>
                      <div className="proj-team-info">
                        <div className="proj-team-name">{member.name}</div>
                        <div className="proj-team-role">
                          {member.taskCount} task{member.taskCount > 1 ? 's' : ''} assigned
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="proj-empty-box">
                  <Users size={20} style={{ margin: '0 auto 6px auto', display: 'block', opacity: 0.5 }} />
                  No team members are currently assigned to tasks in this project.
                </div>
              )}
            </div>

            {/* Tasks under this project ("er under e task dekhai") */}
            <div>
              <div className="proj-modal-section-title">
                <CheckSquare size={16} color="var(--primary)" />
                <span>Tasks in this Project ({detailTasks.length})</span>
              </div>
              {isDetailLoading ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <RefreshCw className="animate-spin" size={18} style={{ display: 'inline-block', marginRight: '6px' }} />
                  Loading project tasks...
                </div>
              ) : detailTasks.length > 0 ? (
                <div className="proj-tasks-list">
                  {detailTasks.map((task) => (
                    <div
                      key={task.id}
                      className="proj-task-item"
                      onClick={() => {
                        setSelectedDetailProject(null);
                        navigate(`/tasks?search=${encodeURIComponent(task.title)}`);
                      }}
                      title="Click to view full task in task manager"
                    >
                      <div className="proj-task-item-left">
                        <div className={`proj-status-dot ${isTaskOverdue(task) ? 'overdue' : getTaskStatusKey(task.status)}`} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="proj-task-item-title">{task.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            <span>{task.assignee_name ? `Assigned to: ${task.assignee_name}` : 'Unassigned'}</span>
                            {task.due_date && (
                              <>
                                <span>•</span>
                                <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {isTaskOverdue(task) && <Badge isOverdue={true} />}
                        <Badge type="status" value={task.status} />
                        <Badge type="priority" value={task.priority} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="proj-empty-box">
                  <CheckSquare size={20} style={{ margin: '0 auto 6px auto', display: 'block', opacity: 0.5 }} />
                  No tasks created under this project yet.
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="modal-footer" style={{ margin: '-10px -24px -24px -24px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedDetailProject(null)}
                className="btn btn-secondary"
                style={{ borderRadius: 'var(--radius-pill)' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const pid = selectedDetailProject.id;
                  setSelectedDetailProject(null);
                  navigate(`/tasks?projectId=${pid}`);
                }}
                className="btn-pro-primary"
              >
                <span>Open in Full Tasks Board</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
