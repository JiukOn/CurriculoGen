import React from 'react';
import structureBase from '../data/structure.json'; 

const HelpPanel = ({ onClose }) => {

  const downloadJSON = (filename, data) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", filename);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const downloadVagaTemplate = () => {
    const template = {
      nome: "Título da Vaga (Ex: Desenvolvedor C#)",
      requisitos: ["Experiência com React", ".NET Core 8", "Azure DevOps"],
      responsabilidades: ["Desenvolver APIs", "Manter sistemas legados"],
      diferenciais: ["Inglês Avançado", "Docker"]
    };
    downloadJSON("vaga_exemplo.json", template);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
        
        <button className="close-btn" onClick={onClose} title="Fechar Ajuda">&times;</button>
        
        <header className="help-header">
          <h2 className="help-title">Guia de Bordo <span>JIUKURRICULO</span></h2>
          <p className="help-subtitle">Crie currículos de alto nível otimizados para IA.</p>
        </header>

        <div className="help-scroll-area">
          
          <section className="help-section">
            <h3>🎨 01. Estilo & Visual</h3>
            <p>
              O primeiro painel à esquerda controla a aparência.
            </p>
            <ul className="step-list">
              <li><strong>Modelo:</strong> Escolha entre layouts diferentes (Clássico, Moderno, Minimalista).</li>
              <li><strong>Paleta:</strong> Defina as cores principais (clique nos círculos coloridos).</li>
              <li><strong>Live Preview:</strong> Tudo o que você edita aparece instantaneamente na direita.</li>
            </ul>
          </section>

          <hr className="divider"/>

          <section className="help-section">
            <h3>📝 02. Preenchendo seus Dados</h3>
            <p>
              Agora temos duas formas de inserir suas informações. Escolha a que preferir:
            </p>
            
            <div className="info-box">
              <strong>✨ MODO FÁCIL (Recomendado):</strong><br/>
              Clique no botão <strong>"Abrir Formulário de Dados"</strong>. Uma janela grande se abrirá onde você pode preencher campos (Nome, Experiência, etc.) visualmente, sem mexer em código.
            </div>

            <div style={{marginTop: '10px', fontSize: '0.9rem', color: 'var(--text-muted)'}}>
              <strong>💻 MODO AVANÇADO (JSON):</strong><br/>
              Para usuários técnicos. Edite o código bruto. Útil para copiar e colar dados de outros lugares.
            </div>

            <div className="action-row" style={{marginTop: '15px'}}>
              <span>Quer começar do zero ou restaurar o padrão?</span>
              <button 
                className="neo-btn small-btn" 
                onClick={() => downloadJSON("meu-curriculo-base.json", structureBase)}
                style={{borderColor: '#2ecc71', color: '#2ecc71'}}
              >
                📥 Baixar Modelo de Currículo (.json)
              </button>
            </div>
          </section>

          <hr className="divider"/>

          <section className="help-section">
            <h3>🧠 03. Otimização com IA (Gemini)</h3>
            <p>
              A IA reescreve seu currículo para passar nos filtros de RH (ATS), usando as palavras-chave exatas da vaga que você deseja.
            </p>
            
            <div className="tutorial-steps">
              <div className="step-item">
                <span className="step-num">1</span>
                <div className="step-content">
                  <strong>Obtenha sua Chave (API Key):</strong>
                  <p>O sistema usa a IA do Google. É gratuito e rápido.</p>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="external-link-btn"
                  >
                    🔑 Gerar Chave no Google AI Studio ↗
                  </a>
                </div>
              </div>

              <div className="step-item">
                <span className="step-num">2</span>
                <div className="step-content">
                  <strong>Descreva a Vaga:</strong>
                  <p>Cole a descrição da vaga (LinkedIn, Gupy, etc) ou importe um JSON.</p>
                  <button 
                    className="neo-btn small-btn" 
                    onClick={downloadVagaTemplate}
                    style={{borderColor: '#9b59b6', color: '#9b59b6', marginTop: '5px', padding: '6px'}}
                  >
                    📥 Baixar Modelo de Vaga (.json)
                  </button>
                </div>
              </div>

              <div className="step-item">
                <span className="step-num">3</span>
                <div className="step-content">
                  <strong>Otimizar:</strong>
                  <p>Clique em "Otimizar Currículo". A IA vai analisar e reescrever seus textos mantendo a verdade, mas focando na vaga.</p>
                </div>
              </div>
            </div>
          </section>

          <hr className="divider"/>

          <section className="help-section">
            <h3>💾 04. Exportar PDF (Importante!)</h3>
            <p>
              Para salvar o arquivo final corretamente:
            </p>
            <ol className="step-list" style={{listStyle: 'decimal', marginLeft: '20px'}}>
              <li>Clique no botão <strong>EXPORTAR PDF</strong> na barra lateral.</li>
              <li>A janela de impressão do navegador abrirá.</li>
              <li>Defina o Destino como <strong>"Salvar como PDF"</strong>.</li>
              <li>
                <span style={{color: '#e74c3c'}}>⚠️ Atenção:</span> Em "Mais Definições", marque a opção <strong>"Gráficos de Segundo Plano"</strong> (Background Graphics).
              </li>
              <li>Defina as Margens como <strong>"Nenhuma"</strong>.</li>
            </ol>
          </section>

        </div>
      </div>
    </div>
  );
};

export default HelpPanel;