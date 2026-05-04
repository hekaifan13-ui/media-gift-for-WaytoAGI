import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, FolderOpen, Clock, Layout } from 'lucide-react';
import { ProjectRow, getProjects, deleteProject } from '../services/storageService';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectListProps {
  onNewProject: () => void;
  onLoadProject: (project: ProjectRow) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onNewProject, onLoadProject }) => {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('确定删除此项目？')) return;
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Projects</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage your poster projects</p>
          </div>
          <button
            onClick={onNewProject}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 active:scale-95"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full mr-3"></div>
            Loading...
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FolderOpen size={64} className="mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No projects yet</p>
            <p className="text-sm mb-6">Create your first poster project to get started</p>
            <button
              onClick={onNewProject}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all"
            >
              <Plus size={16} />
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer"
                  onClick={() => onLoadProject(project)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-50 relative overflow-hidden">
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layout size={40} className="text-gray-200" />
                      </div>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 truncate mb-1">{project.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-md font-medium uppercase">3 Templates</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
