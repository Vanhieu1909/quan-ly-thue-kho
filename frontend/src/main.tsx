if (!localStorage.getItem('cleared_mock_data_v3')) {
  localStorage.clear();
  localStorage.setItem('cleared_mock_data_v3', 'true');
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import UngDung from './UngDung';
import './kieu-dang/toanCuc.css';

window.addEventListener('error', (e) => {
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace;">
    <h2>Runtime Error!</h2>
    <p>${e.message}</p>
    <pre>${e.error?.stack}</pre>
  </div>`;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UngDung />
    </BrowserRouter>
  </StrictMode>,
);
