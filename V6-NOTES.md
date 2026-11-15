# V6 — inspeção procedural

Os dois renders anexados foram analisados: o arquivo “motor” representa uma colheitadeira (plataforma, corpo elevado, rodas dianteiras maiores); o arquivo “hidraulica_transmissao” representa um trator. Referências aceitas como base funcional, não como alvo de reprodução das limitações geométricas.

## Mudanças

- Trator: capô extrudado com inclinação e chanfros, grade com lâminas, ventilação lateral, degraus, espelhos e braços do engate.
- Cabines: pilares, painéis de vidro separados, teto chanfrado, banco, coluna e volante simplificados.
- Rodas: garras em V e parafusos em InstancedMesh; preservada a diferença entre rodas maiores e menores.
- Colheitadeira: corpo e depósito com perfis extrudados, escada, ventilação e molinete aberto com eixo, braços, travessas e dentes.
- Pintura botânica em espaço linear, borracha escura, iluminação direcional e tone mapping ACES.
- Inspeção: mantém pausa até ação explícita, destaca os conjuntos monitorados e oferece botões acessíveis para os três componentes. Marcadores clicáveis e gravidade amarela/vermelha. Movimento reduzido observado ao vivo; câmera instantânea, sem giro automático nem pulsação.
- Zoom também por +/−; menus de inspeção quebram linha no mobile; projeção ajusta FOV para telas estreitas. Etiquetas afastadas verticalmente quando se sobrepõem.

Geometria inteiramente JavaScript/Three.js r128 em js/viewer3d.js. Sem modelos externos, novo build ou runtime GSAP. A interpolação existente continua sendo a única rotina de câmera.

## Evidência e limites

img2threejs 2.0.1: leitura do protocolo, admissão das duas imagens (PASS), busca local de especificações, assessment e especificação do trator, validação estrita (PASS) e factory inicial gerada em /workspace/agro-v6/createTractorModel.ts. Geometria de produção adaptada manualmente à API existente.

Turntable de ambos os modelos: quatro azimutes presentes, sem colapso de volume (PASS). Buracos permitidos por serem esperados nas janelas e molinete aberto. Esse resultado não prova encaixe mecânico ou fidelidade.

O diagnóstico Tier 1 da comparação direta trator/referência NÃO passou: IoU 0,295, delta de aspecto 0,115 e escala 1,373. O enquadramento é diferente e o objetivo autorizado é evolução visual. Não foi alterado o limiar para forçar aprovação. As folhas de comparação são evidência diagnóstica, não aprovação do pipeline completo. Não foram concluídos os gates de interseção, attachment, cobertura de partes ou todas as revisões sequenciais; não se declara certificação integral img2threejs.

Inferidos: interiores de cabine, ferragens, engates, mecanismo interno, face oposta, traseira e parte inferior. Os blocos de inspeção são representações esquemáticas dos conjuntos, não motores ou transmissões de engenharia. As coordenadas ANCHORS existentes foram mantidas. Não se inferem sensores, valores nem diagnósticos.

## Testes

Playwright/Chromium com SwiftShader: ambos os modelos, cinco ângulos, três focos, pausa persistente, gravidade, movimento reduzido em tempo de execução, zoom por teclado, mobile e destroy — PASS, sem pageerror. Integração real: abrir TR-04/CH-04, focar, restaurar, navegar ao Dashboard e confirmar remoção do canvas — PASS.

Custo observado: trator 7.470 triângulos/112 draw calls; colheitadeira 10.478 triângulos/202 draw calls. Não é benchmark de FPS em GPU móvel. Testes usaram distribuições oficiais locais de Vue/Three por interceptação devido ao bloqueio dos CDNs; produção conserva as URLs existentes.

Artefatos, referências, especificação e scripts: /workspace/agro-v6. Capturas app-TR-04.png e app-CH-04.png; comparação tractor-comparison.png e harvester-comparison.png. Alterados js/viewer3d.js, js/main.js, index.html e css/style.css. Alterações V4/V5 preservadas. Sem commit ou push.
