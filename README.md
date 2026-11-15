# AgroSense V8.5 — interface refinada

Este projeto reúne a tela de login com cena isométrica e o sistema de monitoramento AgroSense redesenhado.

## Como executar

Abra a pasta do projeto no VS Code e execute `index.html` com o Live Server. Você será direcionado ao login. Também pode abrir `login.html` diretamente. É preciso ter internet para carregar Vue 3, Three.js e as fontes.

## Contas para testar

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Operador | operador@agrosense.com | Agro2026! |
| Técnico | tecnico@agrosense.com | Agro2026! |
| Gestor | gestor@agrosense.com | Agro2026! |

Após entrar, o sistema abre `index.html`. No canto superior direito, clique no perfil e em **Sair da conta** para voltar ao login. As opções do menu são ajustadas para cada perfil: operador visualiza Dashboard e Máquinas; técnico também vê Relatórios; gestor tem acesso às quatro seções, incluindo Cadastro. **Configurações** fica disponível para os três perfis.

**Importante:** autenticação e permissões são apenas demonstrativas, no navegador. Não há API de login, armazenamento seguro de senhas nem recuperação de senha por e-mail. Os registros e gráficos exibem dados simulados. Não use este protótipo para controlar acesso a informações reais. Em produção, será necessário backend com sessão segura e autorização em servidor.

## Estrutura

- `login.html`, `login.css`, `login.js`, `login-scene.js`: login e animação isométrica.
- `recuperar-senha.html`, `recuperar-senha.js`: interface de recuperação (sem envio de e-mail no modo demo).
- `js/demo-auth.js`: usuários e sessão locais de demonstração.
- `index.html`, `css/` e `js/`: Início, Dashboard, Máquinas, Cadastro, Relatórios e Configurações.
- `js/preferences.js` e `css/settings.css`: carregamento/salvamento validado de preferências por perfil e estilos da nova seção.
- `assets/img/`: foto agrícola de fundo e marca AgroSense.

O CSS original e os dados simulados do dashboard foram mantidos. Os arquivos `premium.css` e as alterações de interface adicionam microinterações, notificações e feedback visual.

## Configurações

Em **Configurações**, cada perfil pode consultar os próprios dados da sessão, escolher densidade e texto, filtrar os avisos que aparecem na central e selecionar a organização das máquinas e o escopo da telemetria. Clique em **Salvar alterações** para aplicar as escolhas. A opção **Restaurar padrões** redefine todas as preferências.

Essas escolhas são guardadas no `localStorage` do navegador, isoladas por perfil nesta demonstração. Nenhuma senha ou token é salvo nas preferências. A visualização de telemetria também é memorizada quando os controles são usados diretamente no Dashboard. Avisos ocultos na central continuam sendo calculados e apresentados nos painéis e relatórios operacionais.

Não há edição de conta, troca de senha, notificações por e-mail/push, sincronização em servidor ou configurações globais: essas funcionalidades requerem um backend real.

## Refinamento visual V8.5

Esta versão mantém a paleta e a identidade AgroSense, as páginas e os dados da demonstração. O refinamento segue critérios de design para telas de aplicativos descritos no Taste Skill (https://www.tasteskill.dev/docs): tipografia legível, hierarquia, navegação funcional e eliminação de elementos decorativos repetidos.

- **Início:** a logo oficial está na área principal, sem imagem artificial ou segundo painel institucional. Atalhos seguem formato de lista editorial em vez de quatro cards repetidos.
- **Navegação:** sidebar mais discreta, item selecionado com faixa lateral e topo com divisão sutil.
- **Dashboard:** quatro indicadores separados com tratamento de gravidade, painéis com raios menores e legibilidade aprimorada.
- **Configurações:** navegação com ícones funcionais, título claro, formulários alinhados, controles de seleção e feedback visual de alterações não salvas. Há a ação **Descartar** além de **Salvar** e **Restaurar padrões**.
- **Tipografia:** IBM Plex Sans na aplicação, com fallback local quando a fonte online não está disponível.
- **Correção técnica:** o componente que recebe as classes de densidade e ampliação de texto passou a ficar dentro do ponto de montagem do Vue, permitindo que as preferências visuais realmente sejam aplicadas.

### Verificações V8.5

Foram executados testes de interação com Vue 3 e Playwright em Chromium, carregando o HTML, CSS e scripts localmente em uma página de teste (a navegação HTTP local do navegador estava bloqueada). Foram verificados: navegação de Operador/Técnico/Gestor; páginas de Dashboard, Máquinas e Relatórios; atalho de Configurações no perfil; salvar, descartar, restaurar e persistir preferências de aparência após uma nova montagem. Conferências visuais em 1440, 768 e 390 px não mostraram rolagem horizontal na seção de Configurações. Também foram verificadas a sintaxe dos scripts e a ausência de erros de parse nos CSS editados.

Os testes não substituem uma execução completa via Live Server no computador final; o visualizador 3D e a integração de CDNs externas não foram revalidados no navegador durante esta revisão. O arquivo `js/viewer3d.js` permaneceu idêntico ao da V8.4.
