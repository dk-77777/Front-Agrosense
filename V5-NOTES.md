# V5 — seletores e consistência

Implementados cinco seletores compartilhados em Relatórios e Cadastro: v-model e valores internos preservados, opções dinâmicas, seleção identificada, teclado (Enter, Space, setas, Home/End, busca por texto, Escape e Tab), clique fora, scroll interno e posicionamento acima/abaixo conforme espaço. O foco permanece no combobox e aria-activedescendant identifica a opção ativa. Transições CSS de 140 ms, desativadas com movimento reduzido. Sem novo runtime GSAP/Lottie.

Removidos links fictícios do rodapé; aria-current na navegação; avisos idênticos não se acumulam. Consolidados seletores repetidos do estado ativo/hover da navegação. Estilos do componente incorporados à seção de formulários de premium.css. Impressão oculta popovers e elimina animações.

Arquivos: index.html, js/main.js, js/select.js, css/premium.css. V4 e visualizador 3D preservados.

Skills disponíveis: Taste 2.5.1, GSAP e Motion Design 1.0.0 (princípios de foco, duração e simplicidade já consultados na V4). img2threejs 2.0.1 confirmada por doctor, sem aplicação 3D. As outras skills sugeridas não estão instaladas. Sites de referência retornaram bloqueio HTTP CONNECT 403.

Testes: regressão V4 nos três perfis; testes V5 no Gestor em 390/768/1024/1440, seletores e filtros, navegação por teclado, permanência durante atualização de dados, cancelamento de modal e validação de setor vazio. PDF gerado em A4 paisagem, uma página. Sem erros JavaScript nesses testes. Scripts e capturas em /workspace/agro-tools/v5.cjs e v5-*.png; PDF em v5-report.pdf. Dependências Vue/Three oficiais interceptadas localmente nos testes devido à rede restrita.

Limites: não houve teste manual com leitor de tela, nem auditoria exaustiva de todos os estados e fluxos de criação/remoção de máquinas e setores. Não se afirma conformidade WCAG completa. A saída PDF foi gerada, mas não houve comparação visual de cada célula impressa. Sem commit ou push.
