# V8.1 — refinamento do dashboard
Camada visual isolada em css/v8.css (remover o <link> reverte). Alterados: index.html, js/main.js, js/charts.js.
- Sidebar clara e compacta; usuário/perfil reais no rodapé. Indicador "Simulação local" no topo.
- KPIs com composição própria; Em atenção/Críticas filtram a lista.
- Alertas em formato de tabela: gravidade, equipamento, métrica, leitura, limite; desvios extras expansíveis.
- Por setor: colunas empilhadas com legenda HTML, tooltip e lista de máquinas do setor ao clicar.
- Telemetria por máquina (histórico real da simulação): sensor, escopo (frota/categoria/máquina), só fora da faixa, limites por categoria.
- js/viewer3d.js intocado (SHA-256 fe15d549...).
Validação: gráficos e layout renderizados em Chromium (harness com os mesmos CSS/JS, sem Vue por falta de rede). App completo com Vue não foi executado aqui.
