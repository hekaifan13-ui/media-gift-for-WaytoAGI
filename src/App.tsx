// @ts-nocheck
import React, { useState } from 'react';
import { AppState, TemplateId, PostcardData } from './types';
import { INITIAL_DATA } from './constants';
import IntroBox from './components/IntroBox';
import Editor from './components/Editor';
import PosterWall from './components/PosterWall';
import { fetchProject } from './services/api';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WALL);
  const [data, setData] = useState<PostcardData>(INITIAL_DATA);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState<string>('');

  const handleNewProject = () => {
    setData({ ...INITIAL_DATA });
    setEditingProjectId(null);
    setEditingProjectName('');
    setAppState(AppState.INTRO);
  };

  const handleEditProject = async (projectId: string) => {
    try {
      const project = await fetchProject(projectId);
      setData(project.data);
      setEditingProjectId(project.id);
      setEditingProjectName(project.name);
      setAppState(AppState.EDITOR);
    } catch (err) {
      console.error('Failed to load project:', err);
      alert('加载项目失败');
    }
  };

  const handleBoxOpen = () => {
    setAppState(AppState.SELECTION);
  };

  const handleBoxClose = () => {
    setAppState(AppState.WALL);
  };

  const handleSelectTemplate = (id: TemplateId) => {
    setData(prev => ({ ...prev, templateId: id }));
    setAppState(AppState.EDITOR);
  };

  const updateData = (key: keyof PostcardData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleBackFromEditor = () => {
    setAppState(AppState.WALL);
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const handleSaved = (projectId: string, projectName: string) => {
    setEditingProjectId(projectId);
    setEditingProjectName(projectName);
  };

  return (
    <div className="w-full h-screen overflow-hidden text-gray-800">
      {appState === AppState.WALL ? (
        <PosterWall
          onNewProject={handleNewProject}
          onEditProject={handleEditProject}
        />
      ) : appState === AppState.INTRO || appState === AppState.SELECTION ? (
        <IntroBox 
          onOpen={handleBoxOpen} 
          onClose={handleBoxClose}
          onSelectTemplate={handleSelectTemplate} 
          appState={appState}
        />
      ) : (
        <Editor 
          data={data} 
          updateData={updateData} 
          onBack={handleBackFromEditor}
          projectId={editingProjectId}
          projectName={editingProjectName}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default App;
