import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

/* TÍTULOS BONITOS: ESTILOS GLOBAIS E RESET */
import './App.css';

/* TÍTULOS BONITOS: INICIALIZAÇÃO DA ENGINE 2026 */

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Falha ao encontrar o elemento root. Verifique seu index.html.");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* O StrictMode ajuda a identificar efeitos colaterais duplicados, 
        o que é vital para nossa lógica de injeção de dados no Iframe. 
    */}
    <App />
  </React.StrictMode>
);