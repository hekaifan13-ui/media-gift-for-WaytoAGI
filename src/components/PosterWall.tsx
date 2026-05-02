// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { TemplateId } from '../types';
import { fetchProjects, deleteProject, ProjectListItem } from '../services/api';
import { TEMPLATES } from '../constants';
import { Plus, Trash2, Edit2, LayoutGrid, Search, Film, Code, Image as ImageIcon } from '../lib/icons';
import { motion, AnimatePresence } from '../lib/motion';

interface PosterWallProps {
  onNewProject: () => void;
  onEditProject: (projectId: string) => void;
}

type TabFilter = 'ALL' | TemplateId;

const TAB_CONFIG: { key: TabFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL', label: '全部', icon: <LayoutGrid size={16} /> },
  { key: TemplateId.MODERN, label: 'Modern 10:16', icon: <ImageIcon size={16} /> },
  { key: TemplateId.CODE, label: 'Dev Mode', icon: <Code size={16} /> },
  { key: TemplateId.LIVESTREAM, label: '直播海报', icon: <Film size={16} /> },
];

const TEMPLATE_COLORS: Record<string, string> = {
  MODERN: '#6366f1',
  CODE: '#22c55e',
  LIVESTREAM: '#8b5cf6',
};

const PosterWall: React.FC<PosterWallProps> = ({ onNewProject, onEditProject }) => {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const templateFilter = activeTab === 'ALL' ? undefined : activeTab;
      const data = await fetchProjects(templateFilter);
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`确定要删除项目「${name}」吗？此操作不可撤销。`)) return;
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('删除失败');
    }
  };

  const filteredProjects = projects.filter(p =>
    searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const getTemplateName = (templateId: string) => {
    return TEMPLATES.find(t => t.id === templateId)?.name || templateId;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-gray-200 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-md"></div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">WaytoAGI 海报编辑器</h1>
              <p className="text-xs text-gray-400 font-medium">海报墙 — 管理所有海报项目</p>
            </div>
          </div>
          <button
            onClick={onNewProject}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98]"
          >
            <Plus size={18} /> 新建海报
          </button>
        </div>
      </header>

      {/* Tabs + Search */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-3">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {TAB_CONFIG.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索项目..."
              className="w-64 bg-gray-100 border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                <LayoutGrid size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-bold mb-2">
                {searchQuery ? '没有找到匹配的项目' : '还没有海报项目'}
              </p>
              <p className="text-sm mb-6">
                {searchQuery ? '尝试其他关键词' : '点击上方「新建海报」创建第一个项目'}
              </p>
              {!searchQuery && (
                <button
                  onClick={onNewProject}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                  <Plus size={18} /> 新建海报
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onEditProject(project.id)}
                    className="group bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: `${TEMPLATE_COLORS[project.template_id] || '#6366f1'}20` }}
                          >
                            <LayoutGrid
                              size={28}
                              style={{ color: TEMPLATE_COLORS[project.template_id] || '#6366f1' }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Template badge */}
                      <div
                        className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider"
                        style={{ backgroundColor: TEMPLATE_COLORS[project.template_id] || '#6366f1' }}
                      >
                        {getTemplateName(project.template_id)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 truncate mb-1 text-sm">{project.name}</h3>
                      <p className="text-[11px] text-gray-400">{formatDate(project.updated_at)}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditProject(project.id); }}
                          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Edit2 size={12} /> 编辑
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, project.id, project.name)}
                          className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                        >
                          <Trash2 size={12} /> 删除
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default PosterWall;
