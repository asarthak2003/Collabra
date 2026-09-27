import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CreateProjectModal from '../components/CreateProjectModal';
import { 
  Plus, 
  Archive, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  Loader2, 
  AlertCircle,
  FolderOpen,
  Calendar,
  User
} from 'lucide-react';

function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Role Protection Checks
  const isAdminOrPM = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_PROJECT_MANAGER';

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/projects');
      setProjects(response.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch workspace projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Auto-dismiss error alert after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Save (Create or Update) handler callback
  const handleSaveProject = async (projectData) => {
    try {
      if (selectedProject) {
        // Edit Mode
        await api.put(`/api/projects/${selectedProject.id}`, projectData);
      } else {
        // Create Mode
        await api.post('/api/projects', projectData);
      }
      fetchProjects();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save project settings.';
      return { success: false, error: msg };
    }
  };

  // Archive Project handler
  const handleArchiveProject = async (id) => {
    setError('');
    try {
      await api.put(`/api/projects/${id}/archive`);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to archive project.');
    }
  };

  // Restore Project handler
  const handleRestoreProject = async (id) => {
    setError('');
    try {
      await api.put(`/api/projects/${id}/restore`);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to restore project.');
    }
  };

  // Delete Project handler (Soft-delete)
  const handleDeleteProject = async (id) => {
    setError('');
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will be lost.')) return;
    try {
      await api.delete(`/api/projects/${id}`);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete project.');
    }
  };

  const openCreateModal = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
        <span className="text-sm font-medium">Loading projects workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Projects</h2>
          <p className="text-xs text-slate-500 mt-1">Browse and coordinate team project boards</p>
        </div>
        {isAdminOrPM && (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition rounded-xl text-xs font-bold text-white shadow-md shadow-indigo-600/10"
          >
            <Plus size={14} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl text-rose-400 text-xs">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Projects Grid view */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className={`bg-slate-900/40 border p-6 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition ${
                project.status === 'ARCHIVED' ? 'border-slate-900/80 opacity-75' : 'border-slate-900'
              }`}
            >
              <div>
                {/* Project Title and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-lg text-white ${
                      project.status === 'ARCHIVED' ? 'bg-slate-800 text-slate-400' : 'bg-indigo-600'
                    }`}>
                      <FolderOpen size={16} />
                    </div>
                    <h3 className="font-bold text-slate-100 text-sm truncate max-w-[150px]" title={project.name}>
                      {project.name}
                    </h3>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    project.status === 'ACTIVE' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {project.status.toLowerCase()}
                  </span>
                </div>

                {/* Project Description */}
                <p className="text-xs text-slate-400 leading-relaxed mb-6 min-h-[48px] line-clamp-3">
                  {project.description || 'No description provided for this project.'}
                </p>

                {/* Metadata */}
                <div className="space-y-2 border-t border-slate-900 pt-4 mb-6">
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                    <User size={12} />
                    <span>Created by: <span className="text-slate-400 font-medium">{project.createdByName || 'Admin'}</span></span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                    <Calendar size={12} />
                    <span>Created: <span className="text-slate-400 font-medium">{new Date(project.createdAt).toLocaleDateString()}</span></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="flex items-center justify-between border-t border-slate-900 pt-4">
                <Link 
                  to={`/tasks?projectId=${project.id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
                >
                  View Tasks Board &rarr;
                </Link>
                
                {isAdminOrPM && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(project)}
                      title="Edit Project"
                      className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-slate-200 rounded-lg transition"
                    >
                      <Edit3 size={14} />
                    </button>
                    {project.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleArchiveProject(project.id)}
                        title="Archive Project"
                        className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-amber-500 rounded-lg transition"
                      >
                        <Archive size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestoreProject(project.id)}
                        title="Restore Project"
                        className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-emerald-500 rounded-lg transition"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      title="Delete Project"
                      className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/10 border border-slate-900 border-dashed py-16 text-center rounded-2xl flex flex-col items-center justify-center">
          <FolderOpen size={40} className="text-slate-700 mb-3" />
          <span className="text-sm font-semibold text-slate-400">No projects found</span>
          <p className="text-xs text-slate-650 mt-1 max-w-xs leading-relaxed">
            {isAdminOrPM 
              ? 'Get started by creating a new project using the button above!' 
              : 'There are no active projects allocated to the workspace yet.'}
          </p>
        </div>
      )}

      {/* Creation / Editing Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        project={selectedProject}
      />

    </div>
  );
}

export default Projects;
