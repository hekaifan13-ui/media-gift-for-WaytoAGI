import React, { useState } from 'react';
import { AppState, TemplateId, PostcardData, Author, ProjectAllData } from './types';
import { INITIAL_PROJECT_DATA } from './constants';
import IntroBox from './components/IntroBox';
import Editor from './components/Editor';
import ProjectList from './components/ProjectList';
import GuestLibrary from './components/GuestLibrary';
import LogoLibrary from './components/LogoLibrary';
import { ProjectMeta, getProject, createProject } from './services/storageService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.PROJECTS);
  const [projectData, setProjectData] = useState<ProjectAllData>({ ...INITIAL_PROJECT_DATA });
  const [activeTemplate, setActiveTemplate] = useState<TemplateId>(TemplateId.LIVESTREAM);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectTitle, setCurrentProjectTitle] = useState<string>('Untitled Project');

  // Current template's data (derived)
  const currentData = projectData[activeTemplate];

  // ── Project List ──
  const handleNewProject = () => {
    setProjectData({ ...INITIAL_PROJECT_DATA });
    setCurrentProjectId(null);
    setCurrentProjectTitle('Untitled Project');
    setAppState(AppState.INTRO);
  };

  const handleLoadProject = async (meta: ProjectMeta) => {
    setCurrentProjectId(meta.id);
    setCurrentProjectTitle(meta.title);
    setAppState(AppState.SELECTION); // show selection while loading
    try {
      const full = await getProject(meta.id);
      if (full) setProjectData(full.data);
    } catch (err) {
      console.error('Failed to load project data:', err);
    }
  };

  // ── Template Selection (Acrylic Box) ──
  const handleBoxOpen = () => {
    setAppState(AppState.SELECTION);
  };

  const handleBoxClose = () => {
    setAppState(AppState.PROJECTS);
  };

  const handleSelectTemplate = async (id: TemplateId) => {
    setActiveTemplate(id);
    // Auto-save new project to DB on first template selection
    if (!currentProjectId) {
      try {
        const project = await createProject(currentProjectTitle, projectData);
        setCurrentProjectId(project.id);
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }
    setAppState(AppState.EDITOR);
  };

  // ── Editor ──
  const updateData = (key: keyof PostcardData, value: any) => {
    setProjectData(prev => ({
      ...prev,
      [activeTemplate]: { ...prev[activeTemplate], [key]: value },
    }));
  };

  const handleBackToSelection = () => {
    // Back from editor → acrylic box (same project)
    setAppState(AppState.SELECTION);
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
    setProjectData(prev => ({
      ...prev,
      [activeTemplate]: {
        ...prev[activeTemplate],
        authors: [...(prev[activeTemplate].authors || []), newAuthor],
      },
    }));
    setAppState(AppState.EDITOR);
  };

  const handleSelectLogoFromLibrary = (url: string) => {
    setProjectData(prev => ({
      ...prev,
      [activeTemplate]: {
        ...prev[activeTemplate],
        logos: [...(prev[activeTemplate].logos || []), url],
      },
    }));
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
          data={currentData} 
          updateData={updateData} 
          onBack={handleBackToSelection}
          projectId={currentProjectId}
          projectTitle={currentProjectTitle}
          projectData={projectData}
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
