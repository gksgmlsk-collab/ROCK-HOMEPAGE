import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';
import './styles/content.css';
import './styles/workspace-shell.css';
import './styles/about-workspace.css';
import './styles/app-workspace.css';
import './styles/intro-experience.css';
import './styles/draconis-showcase.css';
import './styles/awards-showcase.css';
import './styles/home-landing.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
