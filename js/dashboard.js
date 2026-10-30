import { machineState } from "./data/condition.js";
import { stateSummary, machineTabs } from "./ui/machine-state.js";
import {
  format,
  icon,
  statusBadge,
  sensorCard,
  escapeHTML,
} from "./ui/components.js";
import { temperatureChart } from "./ui/chart.js";
import { renderReports } from "./reports.js";
export function renderDashboard(machine, alerts, readings) {
  const stale = !machineState(machine).recent || !readings.length;
  const current =
    !readings.length || stale ? "offline" : machineState(machine).condition;
  const alert = alerts.find((a) => a.status !== "Encerrado");
  const metrics = [
    {
      label: "Temperatura do processo",
      value: stale ? "—" : format(machine.temperature ?? 0),
      unit: "°C",
      symbol: "temperature",
      note: stale ? "Sem leitura recente" : machineState(machine).analysisLabel,
      warning: !stale && machineState(machine).condition === "warning",
    },
    {
      label: "Velocidade de rotação",
      value: stale ? "—" : format(machine.rotation, 0),
      unit: "rpm",
      symbol: "rotation",
      note: stale ? "Sem leitura recente" : "Leitura da operação atual",
    },
    {
      label: "Torque",
      value: stale ? "—" : format(machine.torque),
      unit: "N m",
      symbol: "torque",
      note: stale ? "Sem leitura recente" : "Leitura da operação atual",
    },
  ];
  document.getElementById("dashboard").innerHTML = `
 <section class="panel machine-overview" id="machine-section" aria-labelledby="machine-heading"><div class="machine-identity"><div class="machine-symbol">${icon("machine")}</div><div><span class="machine-id">SUA MÁQUINA · ${escapeHTML(machine.id)}</span><h2 id="machine-heading">${escapeHTML(machine.name)}</h2><p class="machine-meta">${icon("geo-alt")} ${escapeHTML(machine.sector)}</p></div></div><div class="machine-condition"><div><p class="small-text muted">Condição atual</p>${statusBadge(current)}</div><div><p class="small-text muted">Última leitura</p><p class="reading-time">${icon("clock")} ${machine.updatedAt}</p></div></div></section>
 ${stateSummary(machine)}${machineTabs(machine.id)}
 ${stale ? '<p class="status-note mb-3" role="status">Nenhuma leitura recente. Aguarde a próxima comunicação com este equipamento.</p>' : ""}
 <section class="row g-3" aria-label="Leituras dos sensores">${metrics.map(sensorCard).join("")}</section>
 ${alert ? `<section class="attention-banner" aria-label="Atenção necessária">${icon("exclamation-triangle")}<div><h3>Atenção necessária</h3><p>Foi detectada uma condição que deve ser avaliada pela manutenção.</p></div><a href="#alert-modal" data-bs-toggle="modal">Ver detalhes ${icon("arrow-right")}</a></section>` : '<p class="status-note my-4">Nenhum alerta aberto para sua máquina.</p>'}
 <div class="row g-3"><section class="col-12 col-xl-8" aria-labelledby="trend-heading"><div class="panel chart-panel"><div class="panel-heading"><div><h2 id="trend-heading">Tendência da temperatura</h2><p>Temperatura do processo · últimos 30 minutos</p></div><span class="chart-legend">Temperatura</span></div><div class="chart-wrap">${temperatureChart(readings)}</div><div class="chart-bottom"><span>${icon("clock")} Amostra de demonstração · 10:00 – 10:30</span><span>Última leitura <strong>${stale ? "—" : format(machine.temperature ?? 0) + " °C"}</strong></span></div><details class="mt-3 small-text"><summary>Ver leituras em tabela</summary><div class="table-responsive mt-2"><table class="table table-sm"><caption class="visually-hidden">Leituras simuladas de temperatura</caption><thead><tr><th scope="col">Horário</th><th scope="col">Temperatura (°C)</th></tr></thead><tbody>${readings.map((p) => `<tr><td>${escapeHTML(p.time)}</td><td>${format(p.temperature)}</td></tr>`).join("")}</tbody></table></div></details></div></section><section class="col-12 col-xl-4" aria-labelledby="operation-heading"><div class="panel operation-panel"><h2 id="operation-heading">Sua operação</h2><p>Informações do equipamento atual.</p><dl class="data-list"><div><dt>Identificação</dt><dd>${escapeHTML(machine.id)}</dd></div><div><dt>Unidade</dt><dd>${escapeHTML(machine.unit)}</dd></div><div><dt>Setor</dt><dd>${escapeHTML(machine.sector)}</dd></div><div><dt>Responsável</dt><dd>Você</dd></div></dl><button class="btn btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#machine-modal">Ver máquina ${icon("arrow")}</button></div></section></div>
 <section id="alerts-section" class="panel alert-list" aria-labelledby="alerts-heading"><div class="panel-heading"><div><h2 id="alerts-heading">Alertas da sua máquina</h2><p>Acompanhe as ocorrências que precisam de atenção.</p></div><span class="badge-status offline">${alerts.length} ${alerts.length === 1 ? "alerta" : "alertas"}</span></div>${alerts.map((a) => `<article class="alert-row"><span class="icon-tile">${icon("bell")}</span><div><h3>${escapeHTML(a.title)}</h3><p>${escapeHTML(a.description)}</p><a class="small-text" href="#alert-modal" data-bs-toggle="modal">Ver detalhes do alerta ${icon("arrow-right")}</a></div><div class="alert-end"><span class="badge-status warning">${icon("circle")} ${a.status}</span><time>${a.time}</time></div></article>`).join("") || '<p class="muted mt-3">Nenhum alerta para sua máquina.</p>'}<div id="local-reports" aria-live="polite"></div></section>`;
  document.getElementById("dashboard").setAttribute("aria-busy", "false");
  document.getElementById("machine-detail").innerHTML =
    `<span class="machine-id">${escapeHTML(machine.id)}</span><h3 class="mb-3">${escapeHTML(machine.name)}</h3>${statusBadge(current)}<dl class="data-list mt-3"><div><dt>Setor</dt><dd>${escapeHTML(machine.sector)}</dd></div><div><dt>Temperatura</dt><dd>${stale ? "—" : format(machine.temperature ?? 0) + " °C"}</dd></div><div><dt>Rotação</dt><dd>${stale ? "—" : format(machine.rotation, 0) + " rpm"}</dd></div><div><dt>Torque</dt><dd>${stale ? "—" : format(machine.torque) + " N m"}</dd></div><div><dt>Última leitura simulada</dt><dd>${machine.updatedAt}</dd></div></dl><p class="status-note small-text mt-3">Perfil operador · consulta do equipamento. Parâmetros e ações técnicas são restritos.</p>`;
  document.getElementById("alert-title").textContent =
    alert?.title ?? "Nenhum alerta";
  document.getElementById("alert-detail").innerHTML = alert
    ? `<span class="badge-status warning">${icon("exclamation-triangle")} ${alert.status}</span><p class="my-3">${escapeHTML(alert.description)}</p><dl class="data-list"><div><dt>Máquina</dt><dd>${escapeHTML(machine.id)}</dd></div><div><dt>Ocorrência</dt><dd>${alert.id}</dd></div><div><dt>Horário simulado</dt><dd>${alert.time}</dd></div></dl><p class="status-note mt-3">Aguarde a avaliação da manutenção. O reconhecimento deste alerta é uma ação exclusiva do técnico.</p>`
    : "<p>Nenhum alerta aberto.</p>";
  renderReports(machine.id);
}
