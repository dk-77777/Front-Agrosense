# Nova Home (baseada na referência Senai AgroTech)
Reverter: remova `<link ... css/home.css>` e restaure index.html, js/main.js e css/v8.css do backup (AgroSense_V8.1_ANTES_DA_HOME.zip).
Alterados: index.html (apenas o bloco da Home + link do CSS), js/main.js (computed `homeShortcuts`/`homeShortcutCol`, `goFromHome` com destino opcional; removido `homePriorities`), css/v8.css (removidas só as regras antigas da Home), css/home.css (novo).
Intactos: js/viewer3d.js (SHA-256 fe15d549...), Dashboard, Máquinas, Cadastro, Relatórios, login, auth, permissões, sidebar.
Acessos rápidos dependem do perfil (Manutenção não existe): Máquinas, Alertas (Dashboard > alertas), Relatórios, Cadastro e Telemetria (Dashboard > telemetria), os 4 primeiros permitidos.
