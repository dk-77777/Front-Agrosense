import { getMachines, getAlerts } from "../data/store.js";
import { getUsers } from "../data/user-store.js";
import { machineState } from "../data/condition.js";
import { can } from "../permissions.js";
import { esc, detailLink, statusBadge, empty } from "./shared.js";
const cards = (items) =>
  `<div class="row g-3">${items.map(([label, n], index) => `<div class="col-sm-6 col-xl-3"><section class="panel metric-panel h-100 ${label.includes("atenção") ? "metric-warning" : ""}"><div class="metric-label"><h2>${label}</h2><i class="bi bi-${label.includes("Usuários") ? "people" : label.includes("inativas") ? "pause-circle" : label.includes("atenção") ? "exclamation-triangle" : label.includes("Normais") ? "check-circle" : label.includes("atualização") ? "clock" : "grid-1x2"}" aria-hidden="true"></i></div><p class="sensor-value">${n}</p><span class="metric-context">${label.includes("Usuários") ? "Cadastro de acessos" : "Equipamentos da unidade"}</span></section></div>`).join("")}</div>`;
export function overview(root, user) {
  root.classList.add("overview-grid");
  const all = getMachines(),
    active = all.filter((m) => m.active !== false),
    alerts = getAlerts();
  if (can(user, "manageUsers")) {
    root.classList.add("overview-admin");
    const users = getUsers();
    root.innerHTML =
      cards([
        ["Máquinas ativas", active.length],
        ["Máquinas inativas", all.length - active.length],
        ["Usuários ativos", users.filter((u) => u.active !== false).length],
        ["Usuários inativos", users.filter((u) => u.active === false).length],
      ]) +
      '<section class="panel mt-4"><h2>Gestão de cadastros</h2><p class="muted my-3">Mantenha equipamentos e acessos organizados. A inativação preserva os registros históricos.</p><div class="admin-actions"><a href="./maquinas.html"><i class="bi bi-gear-wide-connected" aria-hidden="true"></i><span><strong>Gerenciar máquinas</strong><small>Cadastre, edite e organize os equipamentos.</small></span><i class="bi bi-arrow-right" aria-hidden="true"></i></a><a href="./usuarios.html"><i class="bi bi-people" aria-hidden="true"></i><span><strong>Gerenciar usuários</strong><small>Controle os perfis e acessos da equipe.</small></span><i class="bi bi-arrow-right" aria-hidden="true"></i></a></div></section>';
    return;
  }
  const normal = active.filter((m) => {
      const s = machineState(m);
      return s.recent && s.condition === "normal";
    }),
    attention = active.filter((m) => machineState(m).condition === "warning"),
    stale = active.filter((m) => !machineState(m).recent);
  root.innerHTML = cards([
    ["Máquinas monitoradas", active.length],
    ["Normais com dados recentes", normal.length],
    ["Exigem atenção", attention.length],
    ["Sem atualização ou leitura", stale.length],
  ]);
  const priorities = active.filter((m) => {
    const s = machineState(m);
    return !s.recent || s.condition !== "normal";
  });
  root.insertAdjacentHTML(
    "beforeend",
    `<section class="panel mt-4"><h2>${can(user, "viewManagementIndicators") ? "Prioridades da operação" : "Equipamentos para investigar"}</h2><p class="muted mt-2">Condição, comunicação e análise são avaliadas separadamente.</p>${
      priorities
        .map((m) => {
          const s = machineState(m);
          return `<div class="priority-row"><a href="${detailLink(m.id)}">${esc(m.id)} · ${esc(m.name)}</a><span class="priority-state">${s.condition === "unknown" ? "Condição não determinada" : statusBadge(s.condition)} · ${s.communication} · ${s.analysisLabel}</span></div>`;
        })
        .join("") || empty("Nenhuma prioridade identificada.")
    }</section><section class="panel mt-4"><h2>Ocorrências da amostra</h2><p class="muted mt-2">19/10/2026 · conjunto demonstrativo. Reconhecimento registra visualização, sem encerrar a ocorrência.</p><div class="d-flex flex-wrap gap-4 mt-3"><span>Abertas: <strong>${alerts.filter((a) => a.status === "Aberto").length}</strong></span><span>Reconhecidas, ainda em acompanhamento: <strong>${alerts.filter((a) => a.status === "Reconhecido").length}</strong></span><span>Encerradas: <strong>${alerts.filter((a) => a.status === "Encerrado").length}</strong></span></div><a href="./alertas.html" class="btn btn-outline-secondary mt-3">Consultar ocorrências</a></section>`,
  );
  if (can(user, "viewManagementIndicators")) {
    const distribution = [
      [
        "Normal",
        active.filter((m) => machineState(m).condition === "normal").length,
      ],
      ["Atenção", attention.length],
      [
        "Não determinada",
        active.filter((m) => machineState(m).condition === "unknown").length,
      ],
    ];
    root.insertAdjacentHTML(
      "beforeend",
      `<section class="panel mt-4"><h2>Distribuição das condições</h2><p class="small-text muted mt-2">Últimas análises dos equipamentos ativos. Comunicação é exibida separadamente.</p>${distribution.map(([label, n]) => `<div class="mt-3"><div class="d-flex justify-content-between"><span>${label}</span><span>${n} de ${active.length}</span></div><div class="progress mt-1" role="progressbar" aria-label="${label}" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="${Math.max(active.length, 1)}"><div class="progress-bar" style="width:${active.length ? (n / active.length) * 100 : 0}%;background:var(--color-brand)"></div></div></div>`).join("")}</section>`,
    );
    const counts = new Map();
    alerts.forEach((a) =>
      counts.set(a.machineId, (counts.get(a.machineId) || 0) + 1),
    );
    root.insertAdjacentHTML(
      "beforeend",
      `<section class="panel mt-4"><h2>Equipamentos com mais ocorrências</h2>${
        [...counts]
          .sort((a, b) => b[1] - a[1])
          .map(
            ([id, n]) =>
              `<div class="d-flex justify-content-between border-bottom py-3"><a href="${detailLink(id)}">${esc(id)}</a><span>${n} ocorrência(s)</span></div>`,
          )
          .join("") || empty()
      }</section>`,
    );
  }
}
