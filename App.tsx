import React, { useState } from 'react';
import { AppState, TemplateId, PostcardData } from './types';
import { INITIAL_DATA } from './constants';
import IntroBox from './components/IntroBox';
import Editor from './components/Editor';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INTRO);
  const [data, setData] = useState<PostcardData>(INITIAL_DATA);

  const handleBoxOpen = () => {
    setAppState(AppState.SELECTION);
  };

  const handleBoxClose = () => {
    setAppState(AppState.INTRO);
  };

  const handleSelectTemplate = (id: TemplateId) => {
    setData(prev => ({ ...prev, templateId: id }));
    // Add a small delay for animation effect if we were doing complex transitions
    setAppState(AppState.EDITOR);
  };

  const updateData = (key: keyof PostcardData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleBack = () => {
    setAppState(AppState.SELECTION);
  };

  return (
    <div className="w-full h-screen overflow-hidden text-gray-800">
      {/* Background elements if needed */}
      
      {appState === AppState.INTRO || appState === AppState.SELECTION ? (
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
        />
      )}
    </div>
  );
};

export default App;