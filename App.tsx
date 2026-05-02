import React, { useState } from 'react';
import { AppState, TemplateId, PostcardData, Author } from './types';
import { INITIAL_DATA } from './constants';
import IntroBox from './components/IntroBox';
import Editor from './components/Editor';
import ProjectList from './components/ProjectList';
import GuestLibrary from './components/GuestLibrary';
import LogoLibrary from './components/LogoLibrary';
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

  // ── Library Navigation ──
  const handleGoToGuestLibrary = () => {
    setAppState(AppState.GUEST_LIBRARY);
  };

  const handleGoToLogoLibrary = () => {
    setAppState(AppState.LOGO_LIBRARY);
  };

  const handleBackFromLibrary = () => {
    setAppState(AppState.EDITOR);
  };

  const handleSelectGuestFromLibrary = (guest: { name: string; title: string; image: string | null }) => {
    const newAuthor: Author = {
      id: Date.now().toString(),
      name: guest.name,
      title: guest.title,
      image: guest.image,
    };
    setData(prev => ({ ...prev, authors: [...(prev.authors || []), newAuthor] }));
    setAppState(AppState.EDITOR);
  };

  const handleSelectLogoFromLibrary = (url: string) => {
    setData(prev => ({ ...prev, logos: [...(prev.logos || []), url] }));
    setAppState(AppState.EDITOR);
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
      ) : appState === AppState.GUEST_LIBRARY ? (
        <GuestLibrary
          onBack={handleBackFromLibrary}
          onSelectGuest={handleSelectGuestFromLibrary}
        />
      ) : appState === AppState.LOGO_LIBRARY ? (
        <LogoLibrary
          onBack={handleBackFromLibrary}
          onSelectLogo={handleSelectLogoFromLibrary}
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
          onGoToGuestLibrary={handleGoToGuestLibrary}
          onGoToLogoLibrary={handleGoToLogoLibrary}
        />
      )}
    </div>
  );
};

export default App;
