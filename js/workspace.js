import { usersView, userForm } from "./views/users.js";
import { overview } from "./views/overview.js";
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
    "usuarios.html": [
      "Usuários",
      "Gerencie os acessos e os perfis da unidade.",
    ],
    "cadastro-usuario.html": [
      "Cadastro de usuário",
      "Identifique o usuário e suas permissões.",
    ],
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
    "usuarios.html": "manageUsers",
    "cadastro-usuario.html": "manageUsers",
    "historico.html": "viewDetailedHistory",
    "cadastro-maquina.html": "createMachine",
    "alertas.html": "viewAlerts",
    "alerta-reconhecido.html": "viewAlerts",
    "maquina.html": "viewMachines",
    "maquinas.html": "viewMachines",
  };
  document.querySelector(".page-header button").hidden = true;
  document.querySelector(".page-header .eyebrow").textContent = "OPERAÇÃO";
  if (can(user, "manageUsers"))
    titles["index.html"] = [
      "Administração da unidade",
      "Gerencie os cadastros de máquinas e os acessos da equipe.",
    ];
  else if (can(user, "acknowledgeAlert"))
    titles["index.html"] = [
      "Monitoramento da manutenção",
      "Identifique os equipamentos e as ocorrências que precisam de avaliação.",
    ];
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
    if (page === "usuarios.html") usersView(root, user);
    else if (page === "cadastro-usuario.html") userForm(root, user);
    else if (page === "maquinas.html") machinesView(root, user);
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
      overview(root, user);
    }
  } catch {
    root.innerHTML =
      empty(
        "Não foi possível carregar os dados locais. Os dados existentes foram preservados. Tente novamente.",
      ) +
      '<button class="btn btn-primary mt-3" id="retry">Tentar novamente</button>';
    root
      .querySelector("#retry")
      .addEventListener("click", () => initWorkspace(user));
  } finally {
    root.setAttribute("aria-busy", "false");
  }
}
