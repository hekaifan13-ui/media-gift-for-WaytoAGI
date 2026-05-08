import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layout, Search, Clock } from 'lucide-react';
import { ProjectRow, getProjects, deleteProject } from '../services/storageService';
import { TemplateId } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectListProps {
  onNewProject: () => void;
  onLoadProject: (project: ProjectRow) => void;
}

/** Find the first available image from project data, return url + template aspect */
function getProjectPreview(project: ProjectRow): { url: string; aspect: string } | null {
  const data = project.data;
  if (!data) return null;
  const order: { tid: TemplateId; aspect: string }[] = [
    { tid: TemplateId.MODERN, aspect: '10/16' },
    { tid: TemplateId.LIVESTREAM, aspect: '16/9' },
    { tid: TemplateId.CODE, aspect: '4/3' },
  ];
  for (const { tid, aspect } of order) {
    const tpl = data[tid];
    if (tpl?.image) return { url: tpl.image, aspect };
  }
  return null;
}

const TABS = ['All', 'Recent', 'Favorites'];

const ProjectList: React.FC<ProjectListProps> = ({ onNewProject, onLoadProject }) => {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchValue, setSearchValue] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

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
    if (!confirm('Delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F0F0F0] p-4 md:p-12 flex items-center justify-center font-sans relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-[50%] left-[50%] w-[30%] h-[30%] bg-amber-100/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />

      {/* Main Container */}
      <div className="w-[95%] max-w-[1300px] bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col relative z-10 border border-gray-100 min-h-[80vh]">
        
        {/* Header */}
        <header className="bg-white flex flex-col md:flex-row items-center justify-between px-10 py-8 relative z-20">
          {/* Logo & Tabs */}
          <div className="flex items-center space-x-12">
            {/* Logo Icon */}
            <div className="flex items-center group cursor-pointer relative w-7 h-7">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-black transition-transform duration-500 group-hover:scale-110">
                <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.6"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            
            {/* Tabs */}
            <nav className="flex space-x-8">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative py-2 text-[15px] font-medium transition-all duration-300 ${
                    activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="relative z-10 transition-all duration-300 hover:scale-105 hover:font-semibold inline-block">{tab}</span>
                  <span 
                    className={`absolute bottom-0 left-0 h-[2px] bg-black rounded-full transition-all duration-500 ease-out ${
                      activeTab === tab ? 'w-full' : 'w-0'
                    }`} 
                  />
                </button>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <div className={`mt-6 md:mt-0 flex-grow max-w-[400px] mx-8 transition-all duration-500 ${searchFocused ? 'scale-105' : ''}`}>
            <div className={`relative transition-all duration-300 ${searchFocused ? 'shadow-lg shadow-gray-200/50 rounded-full' : ''}`}>
              <div className={`absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform duration-300 ${searchFocused ? 'scale-110' : ''}`}>
                <Search className={`w-4 h-4 transition-colors duration-300 ${searchFocused ? 'text-black' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search projects..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full h-12 pl-11 pr-4 border-none rounded-full text-[14px] focus:outline-none transition-all duration-300 ${
                  searchFocused ? 'bg-white ring-2 ring-black/10 placeholder-gray-400' : 'bg-[#F2F2F2] placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {/* New Project Button */}
          <button
            onClick={onNewProject}
            className="mt-6 md:mt-0 flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-full font-medium text-[13px] transition-all active:scale-95 shadow-sm hover:shadow-md"
          >
            <Plus size={16} />
            New Project
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 bg-[#F3F4F6] relative">
          {/* Soft Gradient transition */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white via-white/50 to-transparent z-0" />

          {/* Content Grid */}
          <main className="relative z-10 px-10 pb-12 pt-10">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full mr-3"></div>
                Loading...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Layout size={64} className="mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2 text-gray-500">
                  {searchValue ? 'No matching projects' : 'No projects yet'}
                </p>
                <p className="text-sm mb-6 text-gray-400">
                  {searchValue ? 'Try a different search term' : 'Create your first poster project to get started'}
                </p>
                {!searchValue && (
                  <button
                    onClick={onNewProject}
                    className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-full font-medium text-sm transition-all"
                  >
                    <Plus size={16} />
                    Create First Project
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[6px]">
                <AnimatePresence>
                  {filteredProjects.map((project, index) => {
                    const preview = getProjectPreview(project);
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.08 }}
                        className="flex flex-col h-full bg-white p-6 sm:p-8 rounded-[32px] group/card transition-all duration-500 hover:bg-gray-50/80 hover:shadow-lg cursor-pointer"
                        onClick={() => onLoadProject(project)}
                      >
                        {/* Top Row */}
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="text-[14px] font-medium text-[#1A1A1A] truncate pr-2 transition-all duration-300 group-hover/card:font-semibold origin-left">
                            {project.title}
                          </h3>
                          <span className="text-[13px] text-[#999999] font-normal shrink-0">
                            {new Date(project.updated_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Center - Poster */}
                        <div className="flex-grow flex items-center justify-center mb-10 px-2">
                          <div className="relative w-[75%] max-w-full group/poster transition-all duration-500 hover:scale-[1.08] hover:-translate-y-2">
                            {/* Enhanced Shadow */}
                            <div className="absolute inset-0 bg-black/40 blur-[40px] rounded-[32px] scale-90 translate-y-10 transition-all duration-500 group-hover/poster:bg-black/50 group-hover/poster:blur-[50px] group-hover/poster:translate-y-14" />
                            
                            {/* Poster Image */}
                            <div className="relative z-10 transition-transform duration-500">
                              {preview ? (
                                <img
                                  src={preview.url}
                                  alt={project.title}
                                  className="relative w-full object-cover rounded-[20px] shadow-sm transition-all duration-500 group-hover/poster:shadow-2xl"
                                  style={{ aspectRatio: preview.aspect }}
                                  crossOrigin="anonymous"
                                />
                              ) : (
                                <div className="relative w-full aspect-[2/3] rounded-[20px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <Layout size={32} className="text-gray-300" />
                                </div>
                              )}
                              {/* Shine overlay on hover */}
                              <div className="absolute inset-0 rounded-[20px] bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="flex justify-between items-center mt-auto">
                          <span className="text-[12px] text-[#666666] font-normal flex items-center gap-1">
                            <Clock size={11} />
                            3 Templates
                          </span>
                          <button
                            onClick={(e) => handleDelete(e, project.id)}
                            className="relative text-[13px] font-bold text-gray-400 overflow-hidden group/btn hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProjectList;
