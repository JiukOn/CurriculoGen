import React from 'react';
// Importamos a estrutura base para permitir que o usuário baixe o "Reset" se precisar
import structureBase from '../data/structure.json'; 

const HelpPanel = ({ onClose }) => {

  // Função utilitária para gerar e baixar arquivos JSON
  const downloadJSON = (filename, data) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", filename);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  // Gera o template de Vaga na hora
  const downloadVagaTemplate = () => {
    const template = {
      nome: "Título da Vaga (Ex: Desenvolvedor C#)",
      requisitos: ["Requisito 1", "Requisito 2"],
      responsabilidades: ["Responsabilidade 1", "Responsabilidade 2"],
      diferenciais: ["Diferencial 1"]
    };
    downloadJSON("vagaDesc.json", template);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
        
        {/* Botão de Fechar */}
        <button className="close-btn" onClick={onClose} title="Fechar Ajuda">&times;</button>
        
        <header className="help-header">
          <h2 className="help-title">Guia de Bordo <span>JIUKURRICULO</span></h2>
          <p className="help-subtitle">Domine a arte de criar currículos otimizados para IA.</p>
        </header>

        <div className="help-scroll-area">
          
          {/* --- SEÇÃO 01: VISUAL --- */}
          <section className="help-section">
            <h3>🎨 01. Editor Visual</h3>
            <p>
              Comece definindo a "cara" do seu currículo. No painel superior esquerdo:
            </p>
            <ul className="step-list">
              <li><strong>Modelo:</strong> Escolha entre layouts diferentes (ex: Model 1, Model 2).</li>
              <li><strong>Paleta:</strong> Altere as cores de destaque (Cyberpunk, Graphite, Ocean, etc).</li>
              <li><strong>Preview:</strong> Tudo é atualizado em tempo real na direita.</li>
            </ul>
          </section>

          <hr className="divider"/>

          {/* --- SEÇÃO 02: DADOS --- */}
          <section className="help-section">
            <h3>📝 02. Seus Dados (JSON)</h3>
            <p>
              O coração do sistema. Edite seus dados diretamente no formato <strong>JSON</strong>. 
              Isso garante que a IA consiga ler e estruturar tudo perfeitamente.
            </p>
            
            <div className="info-box">
              <strong>Dica de Ouro:</strong> Mantenha a estrutura das chaves (ex: <code>"experiencias"</code>, <code>"contato"</code>). Se quebrar o formato, um aviso aparecerá.
            </div>

            <div className="action-row">
              <span>Precisa restaurar o modelo original ou começar do zero?</span>
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

          {/* --- SEÇÃO 03: IA NEURAL (CORE) --- */}
          <section className="help-section">
            <h3>🧠 03. Neural Optimizer (IA)</h3>
            <p>
              A ferramenta mais poderosa. Ela reescreve seu currículo para passar nos filtros de RH (ATS) baseado na vaga.
            </p>
            
            <div className="tutorial-steps">
              <div className="step-item">
                <span className="step-num">1</span>
                <div className="step-content">
                  <strong>Obtenha sua Chave (API Key):</strong>
                  <p>O serviço usa o Google Gemini. É gratuito para uso pessoal.</p>
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
                  <p>Você pode colar o texto da vaga ou importar um JSON organizado.</p>
                  <button 
                    className="neo-btn small-btn" 
                    onClick={downloadVagaTemplate}
                    style={{borderColor: '#9b59b6', color: '#9b59b6', marginTop: '5px'}}
                  >
                    📥 Baixar Modelo de Vaga (.json)
                  </button>
                </div>
              </div>

              <div className="step-item">
                <span className="step-num">3</span>
                <div className="step-content">
                  <strong>Otimizar:</strong>
                  <p>Clique em "Otimizar Currículo". O sistema tentará vários modelos de IA até conseguir o melhor resultado.</p>
                </div>
              </div>
            </div>
          </section>

          <hr className="divider"/>

          {/* --- SEÇÃO 04: EXPORTAÇÃO --- */}
          <section className="help-section">
            <h3>💾 04. Exportar PDF</h3>
            <p>
              Para gerar o arquivo final:
            </p>
            <ol className="step-list" style={{listStyle: 'decimal', marginLeft: '20px'}}>
              <li>Clique no botão grande <strong>EXPORTAR PDF</strong>.</li>
              <li>A janela de impressão do navegador abrirá.</li>
              <li>Defina o Destino como <strong>"Salvar como PDF"</strong>.</li>
              <li>Em "Mais Definições", marque <strong>"Gráficos de Segundo Plano"</strong>.</li>
              <li>Defina Margens como <strong>"Nenhuma"</strong> (Isso é crucial!).</li>
            </ol>
          </section>

        </div>
      </div>
    </div>
  );
};

export default HelpPanel;