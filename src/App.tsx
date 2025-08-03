import React from 'react';
import ComparisonView from './components/ComparisonView';
import { Toaster } from 'sonner';

function App() {
  return (
    <div className="App">
      <ComparisonView />
      <Toaster position="top-right" />
    </div>
  );
}

export default App; 