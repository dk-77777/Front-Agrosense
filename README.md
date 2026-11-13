# AgroSense — demonstração integrada

Este projeto reúne a tela de login com cena isométrica e o sistema de monitoramento AgroSense redesenhado.

## Como executar

Abra a pasta do projeto no VS Code e execute `index.html` com o Live Server. Você será direcionado ao login. Também pode abrir `login.html` diretamente. É preciso ter internet para carregar Vue 3, Three.js e as fontes.

## Contas para testar

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Operador | operador@agrosense.com | Agro2026! |
| Técnico | tecnico@agrosense.com | Agro2026! |
| Gestor | gestor@agrosense.com | Agro2026! |

Após entrar, o sistema abre `index.html`. No canto superior direito, clique no perfil e em **Sair da conta** para voltar ao login. As opções do menu são ajustadas para cada perfil: operador visualiza Dashboard e Máquinas; técnico também vê Relatórios; gestor tem acesso às quatro seções, incluindo Cadastro.

**Importante:** autenticação e permissões são apenas demonstrativas, no navegador. Não há API de login, armazenamento seguro de senhas nem recuperação de senha por e-mail. Os registros e gráficos exibem dados simulados. Não use este protótipo para controlar acesso a informações reais. Em produção, será necessário backend com sessão segura e autorização em servidor.

## Estrutura

- `login.html`, `login.css`, `login.js`, `login-scene.js`: login e animação isométrica.
- `recuperar-senha.html`, `recuperar-senha.js`: interface de recuperação (sem envio de e-mail no modo demo).
- `js/demo-auth.js`: usuários e sessão locais de demonstração.
- `index.html`, `css/` e `js/`: Dashboard, Máquinas, Cadastro e Relatórios.
- `assets/img/`: foto agrícola de fundo e marca AgroSense.

O CSS original e os dados simulados do dashboard foram mantidos. Os arquivos `premium.css` e as alterações de interface adicionam microinterações, notificações e feedback visual.
