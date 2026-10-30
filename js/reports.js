import { escapeHTML, notify } from "./ui/components.js";
const KEY = "agrosenseReports";
function getReports() {
  const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  if (!Array.isArray(saved))
    throw new Error("Armazenamento de relatos inválido.");
  return saved;
}
export function renderReports(machineId) {
  const target = document.getElementById("local-reports");
  if (!target) return;
  try {
    const reports = getReports().filter((r) => r.machineId === machineId);
    target.innerHTML = reports.length
      ? `<h3 class="mt-4 mb-2">Seus relatos locais (${reports.length})</h3>${reports
          .slice(-3)
          .reverse()
          .map(
            (r) =>
              `<div class="status-note mt-2"><span class="small-text muted">${escapeHTML(new Date(r.createdAt).toLocaleString("pt-BR"))} · Salvo neste navegador</span><p class="report-copy mt-1">${escapeHTML(r.description)}</p></div>`,
          )
          .join("")}`
      : "";
  } catch {
    target.textContent =
      "Não foi possível ler os relatos deste navegador. Os dados existentes foram preservados.";
  }
}
export function setupReports(user, machine) {
  document.getElementById("report-machine").value =
    `${machine.id} · ${machine.name}`;
  document
    .getElementById("report-modal")
    .addEventListener("shown.bs.modal", () =>
      document.getElementById("report-description").focus(),
    );
  document.getElementById("report-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("report-description");
    const error = document.getElementById("report-error");
    error.hidden = true;
    const description = input.value.trim();
    if (description.length < 10) {
      error.textContent = "Descreva o problema com pelo menos 10 caracteres.";
      error.hidden = false;
      input.focus();
      return;
    }
    try {
      const reports = getReports();
      reports.push({
        id: crypto.randomUUID(),
        machineId: machine.id,
        userId: user.id,
        description,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(KEY, JSON.stringify(reports));
      input.value = "";
      bootstrap.Modal.getInstance(
        document.getElementById("report-modal"),
      ).hide();
      renderReports(machine.id);
      notify(
        "Relato salvo neste navegador. Nenhuma mensagem foi enviada à manutenção.",
      );
    } catch {
      error.textContent =
        "Não foi possível salvar. Verifique o armazenamento do navegador e tente novamente. Seu texto foi preservado.";
      error.hidden = false;
    }
  });
}
