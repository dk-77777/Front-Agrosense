export { escapeHTML as esc, statusBadge, format } from "../ui/components.js";
export const detailLink = (id) => `./maquina.html?id=${encodeURIComponent(id)}`;
export function table(headers, rows) {
  return `<p class="table-scroll-hint"><i class="bi bi-arrow-left-right" aria-hidden="true"></i> Deslize a tabela para ver todas as colunas.</p><div class="table-responsive" tabindex="0" role="region" aria-label="Tabela de registros, role horizontalmente quando necessário"><table class="table align-middle"><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
export function empty(text = "Nenhum registro encontrado.") {
  return `<p class="status-note" role="status">${text}</p>`;
}
