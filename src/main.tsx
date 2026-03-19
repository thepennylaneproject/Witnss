import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { client } from './lib/appwrite';
import './styles/globals.css';

/** Verifies Appwrite Cloud reachability on each app load (see Appwrite Client.ping). */
void client
  .ping()
  .then(() => {
    console.info('[Witnss] Appwrite ping succeeded.');
  })
  .catch((err: unknown) => {
    console.warn('[Witnss] Appwrite ping failed — check endpoint, project ID, and network.', err);
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
