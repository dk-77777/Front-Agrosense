# AgroSense · Painel do Operador

Primeira etapa do frontend: painel responsivo em HTML5, CSS3, Bootstrap 5.3 e JavaScript Vanilla com módulos ES. Não há framework SPA, backend ou build obrigatório.

## Executar

Pré-requisitos: Node.js 24 (validado com 24.19.0), npm 11 e Python 3.

```sh
cd /workspace/Front-Agrosense
npm ci
npm start
```

O servidor de desenvolvimento usa a porta 4173. Acesse `login.html` e entre com **operador@agrosense.com**, sem senha. Abrir o HTML por `file://` não funciona com os módulos e a leitura JSON; use um servidor HTTP.

Os arquivos de Bootstrap, Bootstrap Icons e Manrope estão incluídos em `assets/`: a interface não depende de CDN. `npm run vendor` reproduz esses arquivos a partir das versões exatas no lockfile. Licenças de terceiros estão junto dos assets.

## Escopo desta etapa

- Painel de uma máquina, condição, três sensores e horário da última amostra.
- Tendência de temperatura em SVG com descrição acessível e tabela alternativa.
- Menu desktop e offcanvas mobile, detalhes de máquina e alerta em modais.
- Relato validado, salvo em `localStorage` e visível após recarregar.
- Sessão demonstrativa em `sessionStorage`, saída e restrições centralizadas.
- Estados de carregamento, erro com nova tentativa, ausência de leituras e conexão offline.

“Painel”, “Minha máquina” e “Alertas” abrem documentos próprios: `index.html`, `maquina.html` e `alertas.html`. A navegação preserva a sessão e identifica a página atual. O operador não reconhece nem encerra alertas, cadastra máquinas ou altera parâmetros.

Os perfis técnico, gestor e administrador têm acesso demonstrativo: `tecnico@agrosense.com`, `gestor@agrosense.com`, `admin@agrosense.com`, todos sem senha. Técnico e gestor consultam máquinas e histórico; somente técnico reconhece alertas. Somente administrador cadastra máquinas. Operador continua limitado à sua máquina. Indicadores gerenciais avançados ainda não foram implementados.

Telas das referências: `maquinas.html` (busca e situação), `historico.html` (máquina e datas), `alertas.html` (situação e máquina), `cadastro-maquina.html` (identificador único e situação), `alerta-reconhecido.html?id=ALT-001` (registro e observação após reconhecimento). Cadastros e reconhecimentos persistem em localStorage; não existe envio ao servidor. Recarregar preserva os registros.

## Dados e integração

`js/data/mock-machines.js`, `mock-alerts.js`, `mock-users.js` e `mock-readings.js` isolam os dados e o serviço. As séries estão em `js/data/readings.json`. A amostra das 10:30:05 é fixa e simulada; não representa comunicação em tempo real. A API futura deve substituir esse serviço e autenticar/autorizar todas as operações no servidor.

Os relatos **não são enviados à manutenção**. São salvos apenas no navegador e por origem, sem sincronização. Sessão e permissões do frontend não constituem segurança de produção. Não armazene dados sensíveis nesta demonstração.

## Estrutura

```text
index.html / login.html   Entradas HTML
css/                     Tokens, base, layout, componentes do painel, responsividade
js/auth.js               Sessão demonstrativa
js/permissions.js        Matriz e navegação por perfil
js/navigation.js         Menu compartilhado
js/dashboard.js          Composição do painel
js/reports.js            Formulário e persistência local
js/ui/                   Componentes e gráfico SVG
js/data/                 Fixtures e serviço de leituras
tests/                   Playwright e axe
skills/                  Guias locais equivalentes aos solicitados
```

## Validação

```sh
npm test
```

O Playwright inicia e encerra seu próprio servidor. Usa Chromium em `/usr/bin/chromium`; em outra máquina, defina `CHROMIUM_PATH` com o caminho do Chromium instalado. No ambiente de nuvem, servidor e navegador precisam da execução com acesso a sockets, fora do sandbox restrito.

Foram executados **22 testes**, todos aprovados, cobrindo login/saída, restrições do operador, modais/teclado, menu mobile, relato/persistência/escape de HTML, erro/recuperação, dados vazios, offline e preservação de armazenamento inválido. Os testes responsivos verificam ausência de overflow e erros no console em **390, 768, 1024, 1366, 1440 e 1920 px**. O axe não encontrou violações automatizadas WCAG A/AA nas telas de acesso, painel e formulário; isso não substitui uma auditoria completa com tecnologias assistivas.

Screenshots por tamanho são geradas em `test-results/operator-*.png`; relatório navegável em `playwright-report/index.html`. Foram inspecionadas as capturas desktop e mobile. Não há build ou typecheck aplicável à stack escolhida.

## Referência visual e pendências

[Figma oficial](https://www.figma.com/design/EuTNENj8GpDqYtS23liNn4/AgroSense-%E2%80%94-Prot%C3%B3tipo-de-Interface-PINT?node-id=0-1).

O proxy bloqueou a consulta ao Figma com HTTP 403. Portanto, os frames, a tela original de acesso e os estados do protótipo **não foram inspecionados**. Esta implementação usa os tokens, tipografia, sidebar de 230 px e conteúdo fornecidos no briefing. A composição e o símbolo da marca são provisórios: a fidelidade visual precisa ser comparada ao frame ou a uma exportação fornecida pelo responsável antes da aprovação final de design. Nenhuma pesquisa externa de referências foi alegada.

As cinco capturas fornecidas pelo usuário orientam a hierarquia, disposição dos formulários, tabelas e telas de reconhecimento. Acesso direto ao Figma continua não verificado. Próximas etapas: indicadores gerenciais avançados, integração backend e autenticação real.

## Ambiente na nuvem

Use o checkout existente. Cada tarefa já tem um ambiente isolado; não crie worktrees sem solicitação explícita. Processos precisam ser reiniciados em novas sessões. As instruções de instalação e início também são salvas no rascunho da configuração do ambiente; salvar esse rascunho não publica o ambiente nem envia código ao GitHub.
