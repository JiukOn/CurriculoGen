import React, { useState } from 'react';

/* --- GUIA DE BORDO & TUTORIAIS REFORMULADO: MODERNO, DIDÁTICO E VISUAL --- */

const HelpPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('quickstart');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content help-modal-modern glass-card" onClick={e => e.stopPropagation()}>
        
        <header className="help-modern-header">
          <div className="help-header-title-box">
            <div>
              <h2>Guia de Bordo <span>JIUKURRICULO</span></h2>
              <p>Domine a criação de currículos profissionais de alta conversão</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} title="Fechar Guia">&times;</button>
        </header>

        {/* NAVEGAÇÃO POR ABAS SIMPLES E DIRETAS */}
        <div className="help-nav-tabs">
          {[
            { id: 'quickstart', label: 'Início Rápido (30s)' },
            { id: 'copilot', label: 'Copiloto & Zero Alucinação' },
            { id: 'a4_layout', label: 'Ajuste de 1 Página A4' },
            { id: 'export_tips', label: 'Exportação & Impressão' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`help-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="help-scroll-area">
          
          {/* ABA 1: INÍCIO RÁPIDO */}
          {activeTab === 'quickstart' && (
            <div className="help-tab-content">
              <div className="help-card-callout">
                <h4>O jeito mais rápido de criar seu currículo:</h4>
                <p>
                  Não precisa começar do zero digitando tudo campo por campo! Você pode arrastar um PDF do seu currículo antigo ou perfil do LinkedIn para o <strong>Copiloto IA</strong> e vê-lo montado na hora.
                </p>
              </div>

              <div className="help-steps-grid">
                <div className="help-step-card">
                  <div className="step-badge">Passo 1</div>
                  <h5>Abra o Copiloto IA</h5>
                  <p>Clique no botão <strong>✨ Copiloto IA</strong> no topo da barra esquerda. Cole sua chave gratuita do Google AI Studio.</p>
                </div>

                <div className="help-step-card">
                  <div className="step-badge">Passo 2</div>
                  <h5>Arraste seus Arquivos</h5>
                  <p>Solte seu currículo antigo em <strong>PDF</strong>, um arquivo de texto ou cole seu LinkedIn na área de evidências.</p>
                </div>

                <div className="help-step-card">
                  <div className="step-badge">Passo 3</div>
                  <h5>Converse & Aplique</h5>
                  <p>Peça ajustes (ex: <em>"Foque na vaga X"</em>). Quando estiver satisfeito, clique em <strong>Aplicar ao Currículo</strong>.</p>
                </div>
              </div>

              <div className="help-tips-box">
                <strong>Dica Pro:</strong> Você pode usar <code>Ctrl + Z</code> para desfazer e <code>Ctrl + Y</code> para refazer qualquer alteração a qualquer momento!
              </div>
            </div>
          )}

          {/* ABA 2: COPILOTO & ZERO ALUCINAÇÃO */}
          {activeTab === 'copilot' && (
            <div className="help-tab-content">
              <h3>O que é a Política de Zero Alucinação?</h3>
              <p>
                Muitas IAs genéricas inventam dados falsos, números inflados ou tecnologias que você nunca usou. No Jiukurriculo, implementamos uma <strong>auditoria estrita de fatos</strong>:
              </p>

              <div className="anti-hallucination-rules">
                <div className="rule-item">
                  <span className="rule-icon">01</span>
                  <div>
                    <strong>Apenas fatos comprováveis:</strong>
                    <p>A IA só inclui o que você explicitamente forneceu no Dossiê de Evidências (PDFs, LinkedIn, textos e mensagens).</p>
                  </div>
                </div>

                <div className="rule-item">
                  <span className="rule-icon">02</span>
                  <div>
                    <strong>Perguntas ao invés de suposições:</strong>
                    <p>Se faltar uma data importante ou métrica de resultado, a IA pergunta no chat para você confirmar em vez de inventar.</p>
                  </div>
                </div>

                <div className="rule-item">
                  <span className="rule-icon">03</span>
                  <div>
                    <strong>Controle Completo do App:</strong>
                    <p>Você pode pedir para a IA mudar o modelo, trocar a paleta de cores ou condensar o espaçamento em linguagem natural.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: AJUSTE DE PÁGINA A4 */}
          {activeTab === 'a4_layout' && (
            <div className="help-tab-content">
              <h3>Como fazer seu currículo caber exatamente em 1 página?</h3>
              <p>
                Recrutadores gastam em média 6 a 10 segundos analisando um currículo. Para cargos juniores e plenos, o ideal é <strong>uma única página A4</strong>.
              </p>

              <div className="density-explanation-cards">
                <div className="density-card">
                  <h4>Modo Compacto</h4>
                  <p>Otimiza os espaçamentos entre linhas e margens para encaixar mais histórico sem deixar páginas em branco indesejadas.</p>
                </div>

                <div className="density-card">
                  <h4>Modo Padrão</h4>
                  <p>Equilíbrio perfeito de leitura com respiro visual para perfis com volume moderado de informações.</p>
                </div>

                <div className="density-card">
                  <h4>Modo Espaçoso</h4>
                  <p>Recomendado para perfis seniores ou acadêmicos com 2 páginas bem distribuídas.</p>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: EXPORTAÇÃO E IMPRESSÃO */}
          {activeTab === 'export_tips' && (
            <div className="help-tab-content">
              <h3>Qual botão de exportação escolher?</h3>

              <div className="export-modes-comparison">
                <div className="export-mode-box">
                  <h4>DOWNLOAD PDF (Recomendado)</h4>
                  <p>Gera o arquivo <code>.pdf</code> diretamente com escala vetorial 2x nítida com apenas 1 clique, sem abrir janelas extras.</p>
                </div>

                <div className="export-mode-box">
                  <h4>IMPRIMIR (A4)</h4>
                  <p>Abre o driver nativo da sua impressora. Caso use essa opção para salvar em PDF:</p>
                  <ul>
                    <li>Marque a opção <strong>"Gráficos de Segundo Plano"</strong> (Background Graphics).</li>
                    <li>Defina as Margens como <strong>"Nenhuma"</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default HelpPanel;
