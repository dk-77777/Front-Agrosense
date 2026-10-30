import { machineState } from "../data/condition.js";
import { escapeHTML, statusBadge } from "./components.js";
export function stateSummary(machine) {
  const s = machineState(machine);
  return `<section class="panel my-3" aria-label="Estado do monitoramento"><div class="row g-3"><div class="col-md-4"><h3>Condição da última análise</h3><p class="mt-2">${s.condition === "unknown" ? '<span class="badge-status offline">Não determinada</span>' : statusBadge(s.condition)}</p></div><div class="col-md-4"><h3>Comunicação</h3><p class="mt-2">${s.communication}</p><p class="small-text muted">Última leitura: ${escapeHTML(s.timestamp?.replace("T", " ") ?? "Nenhuma")}</p></div><div class="col-md-4"><h3>Análise</h3><p class="mt-2">${s.analysisLabel}</p><p class="small-text muted">${s.analysis === "available" ? `Modelo: ${escapeHTML(machine.modelVersion ?? "demonstração v1")} · ${escapeHTML(machine.analysisAt ?? machine.updatedAt)}` : "Leituras disponíveis não representam uma classificação normal."}</p></div></div><p class="small-text muted mt-3">Relógio da amostra: 19/10/2026 10:30:05. Sem atualização após 30 segundos; sem telemetria ao vivo.</p></section>`;
}
export function machineTabs(id) {
  const q = encodeURIComponent(id);
  return `<nav class="d-flex gap-2 flex-wrap my-3" aria-label="Consultas do equipamento"><a class="btn btn-outline-secondary" href="./historico.html?machine=${q}">Histórico da máquina</a><a class="btn btn-outline-secondary" href="./alertas.html?machine=${q}">Alertas da máquina</a></nav>`;
}
