import { escapeHTML, format } from "./components.js";
export function temperatureChart(points) {
  if (!points.length)
    return '<div class="state-panel"><h3>Nenhuma leitura recente</h3><p>Aguarde a próxima comunicação do equipamento.</p></div>';
  const compact = window.matchMedia("(max-width:575px)").matches;
  const width = compact ? 340 : 660,
    height = 220,
    left = 44,
    right = 16,
    top = 18,
    bottom = 32;
  const min = Math.floor(Math.min(...points.map((p) => p.temperature)) / 5) * 5;
  const max = Math.max(
    min + 10,
    Math.ceil(Math.max(...points.map((p) => p.temperature)) / 5) * 5,
  );
  const x = (i) =>
    left + (i * (width - left - right)) / Math.max(points.length - 1, 1);
  const y = (v) => top + ((max - v) / (max - min)) * (height - top - bottom);
  const line = points
    .map(
      (p, i) =>
        `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.temperature).toFixed(1)}`,
    )
    .join(" ");
  const grid = Array.from({ length: 5 }, (_, i) => {
    const v = min + ((max - min) * i) / 4;
    return `<line x1="${left}" y1="${y(v)}" x2="${width - right}" y2="${y(v)}" stroke="#e7ede9" stroke-dasharray="3 5"/><text x="${left - 10}" y="${y(v) + 4}" text-anchor="end">${format(v, Number.isInteger(v) ? 0 : 1)}°</text>`;
  }).join("");
  const labels = points
    .filter((_, i) => i % (compact ? 5 : 3) === 0 || i === points.length - 1)
    .map((p) => {
      const i = points.indexOf(p);
      return `<text x="${x(i)}" y="${height - 8}" text-anchor="middle">${escapeHTML(p.time)}</text>`;
    })
    .join("");
  return `<svg class="sensor-chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">Temperatura do processo nos últimos 30 minutos</title><desc id="chart-desc">De ${format(points[0].temperature)} a ${format(points.at(-1).temperature)} graus Celsius. Valores simulados; tabela completa disponível abaixo.</desc><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#17664d" stop-opacity=".12"/><stop offset="100%" stop-color="#17664d" stop-opacity="0"/></linearGradient></defs><g fill="#647570" font-size="12" font-family="Manrope,sans-serif">${grid}${labels}</g><path d="${line} L${x(points.length - 1)},${height - bottom} L${left},${height - bottom} Z" fill="url(#chart-fill)"/><path d="${line}" stroke="#17664d" stroke-width="2.5" fill="none" stroke-linejoin="round"/><circle cx="${x(points.length - 1)}" cy="${y(points.at(-1).temperature)}" r="4" fill="#17664d" stroke="white" stroke-width="2"/></svg>`;
}
