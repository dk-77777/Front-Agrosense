import { renderNavigation } from "./navigation.js";
import { getMachines, getAlerts } from "./data/store.js";
import { can } from "./permissions.js";
import { machinesView, createView } from "./views/machines.js";
import { historyView } from "./views/history.js";
import { alertsView, recognizedView } from "./views/alerts.js";
import { esc, empty, statusBadge, detailLink } from "./views/shared.js";
import { renderDashboard } from "./dashboard.js";
import { getReadings } from "./data/mock-readings.js";
export async function initWorkspace(user) {
  const root = document.getElementById("dashboard"),
    page = location.pathname.split("/").pop() || "index.html";
  const titles = {
    "index.html": [
      "Visão geral da operação",
      "Acompanhe os equipamentos e suas condições.",
    ],
    "maquinas.html": [
      "Máquinas",
      "Consulte os equipamentos monitorados e seus estados.",
    ],
    "maquina.html": [
      "Detalhe da máquina",
      "Consulte as leituras e a condição do equipamento.",
    ],
    "historico.html": [
      "Histórico de leituras",
      "Compare registros por máquina e período.",
    ],
    "alertas.html": [
      "Alertas",
      "Investigue ocorrências e registre seu reconhecimento.",
    ],
    "cadastro-maquina.html": [
      "Cadastrar máquina",
      "Identifique o equipamento que receberá as leituras.",
    ],
    "alerta-reconhecido.html": [
      "Alerta reconhecido",
      "O reconhecimento foi registrado no histórico da ocorrência.",
    ],
  };
  const required = {
    "historico.html": "viewDetailedHistory",
    "cadastro-maquina.html": "createMachine",
    "alertas.html": "viewAlerts",
    "alerta-reconhecido.html": "viewAlerts",
    "maquina.html": "viewMachines",
    "maquinas.html": "viewMachines",
  };
  document.querySelector(".page-header button").hidden = true;
  document.querySelector(".page-header .eyebrow").textContent = "OPERAÇÃO";
  const title = titles[page] ?? titles["index.html"];
  document.querySelector("h1").textContent = title[0];
  document.querySelector(".page-header h1 + p").textContent = title[1];
  document.querySelector(".breadcrumb-text strong").textContent = title[0];
  document.title = title[0] + " · AgroSense";
  document.querySelector(".topbar-right .avatar").textContent = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  try {
    renderNavigation(
      user,
      getAlerts().filter((a) => a.status === "Aberto").length,
    );
    if (required[page] && !can(user, required[page])) {
      root.innerHTML =
        empty("Acesso restrito. Seu perfil não tem permissão para esta ação.") +
        '<a href="./maquinas.html">Voltar às máquinas</a>';
      return;
    }
    if (page === "maquinas.html") machinesView(root, user);
    else if (page === "cadastro-maquina.html") createView(root, user);
    else if (page === "historico.html") await historyView(root);
    else if (page === "alertas.html") alertsView(root, user);
    else if (page === "alerta-reconhecido.html") recognizedView(root);
    else if (page === "maquina.html") {
      const machine = getMachines().find(
        (m) => m.id === new URLSearchParams(location.search).get("id"),
      );
      if (!machine) {
        root.innerHTML = empty("Máquina não encontrada.");
        return;
      }
      renderDashboard(
        machine,
        getAlerts().filter((a) => a.machineId === machine.id),
        machine.status !== "offline"
          ? (await getReadings()).map((p) => ({
              ...p,
              temperature: p.temperature - 37 + machine.temperature,
            }))
          : [],
      );
      root.querySelector("#alerts-section")?.remove();
      root.querySelector(".attention-banner")?.remove();
      root.insertAdjacentHTML(
        "beforeend",
        `<a class="btn btn-outline-secondary mt-3" href="./maquinas.html">Voltar às máquinas</a>`,
      );
    } else {
      const all = getMachines();
      root.innerHTML = `<div class="row g-3">${[
        ["Máquinas monitoradas", all.length],
        ["Em condição normal", all.filter((m) => m.status === "normal").length],
        ["Exigem atenção", all.filter((m) => m.status === "warning").length],
        ["Sem atualização", all.filter((m) => m.status === "offline").length],
      ]
        .map(
          ([label, value]) =>
            `<div class="col-sm-6 col-xl-3"><section class="panel"><h2>${label}</h2><p class="sensor-value">${value}</p></section></div>`,
        )
        .join(
          "",
        )}</div><section class="panel mt-4"><h2>Condição dos equipamentos</h2>${all.map((m) => `<div class="d-flex flex-wrap gap-3 justify-content-between border-bottom py-3"><a href="${detailLink(m.id)}">${esc(m.id)} · ${esc(m.name)}</a>${statusBadge(m.status)}</div>`).join("")}</section>`;
    }
  } catch {
    root.innerHTML = empty(
      "Não foi possível carregar os dados locais. Os dados existentes foram preservados. Tente recarregar a página.",
    );
  } finally {
    root.setAttribute("aria-busy", "false");
  }
}
