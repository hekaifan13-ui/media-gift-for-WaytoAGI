import React, { useState } from 'react';
import { AppState, TemplateId, PostcardData } from './types';
import { INITIAL_DATA } from './constants';
import IntroBox from './components/IntroBox';
import Editor from './components/Editor';
import ProjectList from './components/ProjectList';
import { ProjectRow } from './services/storageService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.PROJECTS);
  const [data, setData] = useState<PostcardData>(INITIAL_DATA);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string>('Untitled Project');

  // ── Project List ──
  const handleNewProject = () => {
    setData(INITIAL_DATA);
    setCurrentProjectId(null);
    setCurrentProjectTitle('Untitled Project');
    setAppState(AppState.INTRO);
  };

  const handleLoadProject = (project: ProjectRow) => {
    setData(project.data);
    setCurrentProjectId(project.id);
    setCurrentProjectTitle(project.title);
    setAppState(AppState.EDITOR);
  };

  // ── Template Selection ──
  const handleBoxOpen = () => {
    setAppState(AppState.SELECTION);
  };

  const handleBoxClose = () => {
    setAppState(AppState.PROJECTS);
  };

  const handleSelectTemplate = (id: TemplateId) => {
    setData(prev => ({ ...prev, templateId: id }));
    setAppState(AppState.EDITOR);
  };

  // ── Editor ──
  const updateData = (key: keyof PostcardData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleBack = () => {
    setAppState(AppState.PROJECTS);
  };

  return (
    <div className="w-full h-screen overflow-hidden text-gray-800">
      {appState === AppState.PROJECTS ? (
        <ProjectList
          onNewProject={handleNewProject}
          onLoadProject={handleLoadProject}
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
          onBack={handleBack}
          projectId={currentProjectId}
          projectTitle={currentProjectTitle}
          onProjectSaved={(id, title) => {
            setCurrentProjectId(id);
            setCurrentProjectTitle(title);
          }}
        />
      )}
    </div>
  );
};

export default App;
