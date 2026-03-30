import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

export const render = () => {
  let rootElement = document.getElementById('root');

  // If the element doesn't exist, create and append it
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.setAttribute('id', 'root');
    document.body.appendChild(rootElement);
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};
