# Auditoria da interface AgroSense

Escopo: frontend demonstrativo existente, HTML/CSS/Bootstrap 5/JavaScript modular. As alterações anteriores em `css/dashboard.css` e `js/views/overview.js` foram preservadas e refinadas. Sem troca de stack, novas dependências, publicação ou alterações de backend.

## Evidências e correções

| Achado | Correção |
| --- | --- |
| Resumos com hierarquia fraca e blocos muito extensos | Métricas com rótulos menores, números alinhados, cores semânticas e layout de duas colunas adaptativo |
| Detalhes/formulários sem indicação da seção no menu | Associação ao menu de Máquinas, Usuários ou Alertas |
| Inativação em diálogo nativo sem identidade visual | Modal Bootstrap compartilhado, foco inicial em cancelar, Escape, restauração do foco e proteção contra abertura duplicada |
| Cadastros sem retorno claro após navegação | Confirmação acessível após salvar, com fechamento manual e indicação de persistência local |
| Detalhe do operador repetia todas as leituras em outra seção | Removida a repetição; preservados sensores, gráfico, estados e consulta modal |
| Perfil da demonstração exigia digitação manual | Seletores de perfil preenchem o e-mail sem iniciar sessão automaticamente |
| Menu lateral podia ultrapassar a altura de telas pequenas | Rolagem vertical independente e redução de conteúdo secundário em janelas baixas |
| Tabela mobile não explicava como alcançar as ações | Instrução de rolagem, região focável por teclado e botões sem quebra de texto |
| Detalhe e histórico podiam usar séries simuladas diferentes | Geração centralizada por máquina; novos cadastros continuam sem amostras |
| Timestamp inválido/futuro podia resultar em dados recentes | Valores inválidos ou posteriores ao relógio da amostra não indicam comunicação recente |
| Texto secundário em hover de atalho tinha contraste 4,32:1 | Cor ajustada para o verde profundo; mantida verificação axe |

## Verificação

- Regressão dos quatro perfis, filtros, cadastro, edição, inativação, reconhecimento, sessão, persistência e estados.
- Navegação por URLs, contexto do menu e seleção de perfil demonstrativo.
- Modal: cancelar, confirmar, Escape, foco e preservação do formulário/histórico.
- Responsividade existente em 390, 768, 1024, 1366, 1440 e 1920 px.
- Auditoria adicional em sete telas a 390 e 1440 px, incluindo ausência de overflow na página, screenshots e erros de JavaScript.
- Axe WCAG A/AA no acesso/painel do operador e nas telas administrativas/operacionais auditadas. Não equivale a uma certificação ou auditoria manual completa com leitores de tela.
- Comandos: `npm test`, `npm run format:check`, `git diff --check`.
- Capturas: `test-results/audit-*.png`; relatório do runner: `playwright-report/index.html` (arquivos locais ignorados pelo Git).

## Performance e manutenção

Assets, fonte e ícones continuam locais; não há serviços de fontes externos, novas bibliotecas ou build obrigatório. JS da aplicação é modular; a geração das séries e os diálogos foram centralizados para evitar divergências. Esta revisão não mediu Core Web Vitals e não afirma ganho numérico de velocidade.

## Limites mantidos

Autenticação, autorização e persistência são demonstrativas, no navegador. Não há telemetria real, modelo conectado, API ou envio de relatos. As séries são explicitamente simuladas e o relógio é fixo. O protótipo Figma não foi acessado diretamente; as capturas fornecidas e os tokens existentes orientam o design. Publicação, commit e push não são parte desta auditoria.
