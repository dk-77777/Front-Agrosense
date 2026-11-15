# Refinamento V4

Base: refinamentos botânicos do ZIP fornecido (CSS e theme-color). Login, permissões, cálculos, dados e visualizador 3D mantidos.

- ECharts 6.0.0 local em vendor, com licença Apache incluída. Tema botânico, séries contínua/tracejada, tooltip com unidades, eixos pt-BR, teclado e estado vazio.
- Mesmas médias de AgroData.fleetChart, sem suavização geométrica nem limites agregados inventados. Limites individuais permanecem nos componentes existentes.
- ResizeObserver, descarte no unmount e atualização de séries por identificador.
- Movimento: feedback 160–240 ms e gráficos 280–320 ms. prefers-reduced-motion observado também durante a sessão. Indicadores usam transform/opacity sem leitura forçada de layout.
- Taste 2.5.1 orientou acabamento; GSAP core/timeline/performance/frameworks orientaram a escolha de transições simples e cleanup; Motion Design 1.0.0 orientou duração e intenção. Nenhum runtime GSAP/Lottie necessário.
- Skills instaladas em .agents/skills, com origens registradas em skills-lock.json. img2threejs 2.0.1 instalada globalmente; doctor confirmou. Reservada à futura etapa 3D.

Validação: Playwright/Chromium, três contas, quatro larguras (390/768/1024/1440), troca de indicadores, consulta por teclado, movimento reduzido e ausência de erros JavaScript. Scripts e capturas em /workspace/agro-tools. Vue 3.5.24 e Three.js r128 oficiais foram interceptados localmente apenas nos testes devido ao bloqueio de rede dos CDNs. Isso não valida a conectividade de produção. As duas referências visuais mencionadas no pedido não constam dos anexos desta conversa; foi usada a base ZIP.

Arquivos de aplicação: index.html, css/style.css, css/premium.css, js/main.js, js/charts.js e vendor/echarts.min.js. Nenhum commit ou push realizado.
