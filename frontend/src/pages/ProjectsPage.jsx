import React, { useState, useEffect } from 'react';
import { projectsApi } from '../api/projectsApi';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  FolderKanban, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RefreshCw 
} from 'lucide-react';
import Modal from '../components/common/Modal';

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const fetchProjects = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await projectsApi.getProjects();
      setProjects(data.projects);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load projects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
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
      if (modalMode === 'create') {
        await projectsApi.createProject({ name: projectName, description: projectDesc });
      } else {
        await projectsApi.updateProject(currentProject.id, { name: projectName, description: projectDesc });
      }
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
      await projectsApi.deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project.');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#4f46e5' }}>
        <RefreshCw className="animate-spin" size={28} />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
            Project Management
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Create and track strategic company initiatives and team deliverables.
          </p>
        </div>

        {isAdmin ? (
          <button 
            type="button" 
            onClick={handleOpenCreateModal} 
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Create New Project</span>
          </button>
        ) : (
          <span style={{ fontSize: '13px', color: '#64748b', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px' }}>
            Team Member Access (Read-Only)
          </span>
        )}
      </div>

      {error && (
        <div className="alert-banner">
          <AlertTriangle size={20} color="#b91c1c" />
          <div className="alert-desc">{error}</div>
        </div>
      )}

      {/* Projects Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {projects.map((proj) => (
          <div 
            key={proj.id} 
            className="card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              marginBottom: 0
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#f4f4f5',
                  color: '#18181b',
                  border: '1px solid #e4e4e7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FolderKanban size={16} />
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(proj)}
                      className="btn btn-secondary btn-sm"
                      title="Edit project"
                      style={{ padding: '6px' }}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(proj)}
                      className="btn btn-danger btn-sm"
                      title="Delete project"
                      style={{ padding: '6px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                {proj.name}
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', minHeight: '40px', marginBottom: '16px' }}>
                {proj.description || 'No description provided.'}
              </p>
            </div>

            <div>
              {/* Progress Bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600', color: '#64748b' }}>Completion</span>
                  <span style={{ fontWeight: '700', color: '#4f46e5' }}>{proj.progress_percentage}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${proj.progress_percentage}%` }} 
                  />
                </div>
              </div>

              {/* Task Stat Pills */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '14px',
                borderTop: '1px solid #f1f5f9',
                fontSize: '12px',
                color: '#64748b'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} color="#16a34a" /> {proj.completed_tasks} done
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} color="#d97706" /> {proj.pending_tasks} pending
                </span>
                {proj.overdue_tasks > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontWeight: '600' }}>
                    <AlertTriangle size={14} /> {proj.overdue_tasks} overdue
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create New Project' : 'Edit Project Details'}
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
            />
          </div>

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
          <p style={{ fontSize: '14px', color: '#475569' }}>
            Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?
          </p>
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            color: '#991b1b'
          }}>
            ⚠️ <strong>Cascading Delete:</strong> This will permanently delete all tasks associated with this project. This action cannot be undone.
          </div>
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
              onClick={handleDeleteProject}
              className="btn btn-danger"
            >
              Yes, Delete Project
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
