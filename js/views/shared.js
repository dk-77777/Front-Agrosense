export { escapeHTML as esc, statusBadge, format } from "../ui/components.js";
export const detailLink = (id) => `./maquina.html?id=${encodeURIComponent(id)}`;
export function table(headers, rows) {
  return `<div class="table-responsive"><table class="table align-middle"><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
export function empty(text = "Nenhum registro encontrado.") {
  return `<p class="status-note" role="status">${text}</p>`;
}
