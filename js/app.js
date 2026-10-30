import { presentPage } from "./pages.js";
import { temperatureChart } from "./ui/chart.js";
import { getUser } from "./auth.js";
import { profiles, can } from "./permissions.js";
import { getMachines, getAlerts } from "./data/store.js";

import { getReadings } from "./data/mock-readings.js";
import { renderNavigation } from "./navigation.js";
import { renderDashboard } from "./dashboard.js";
import { setupReports } from "./reports.js";
import { initWorkspace } from "./workspace.js";
const syncConnection = () =>
  (document.getElementById("connection-message").hidden = navigator.onLine);
window.addEventListener("online", syncConnection);
window.addEventListener("offline", syncConnection);
syncConnection();
const user = getUser();
if (!user || !profiles[user.role]?.available) location.replace("./login.html");
else if (
  can(user, "viewFleet") ||
  [
    "maquinas.html",
    "historico.html",
    "alertas.html",
    "usuarios.html",
    "cadastro-usuario.html",
  ].includes(location.pathname.split("/").pop())
) {
  initWorkspace(user);
} else if (
  !["", "index.html", "maquina.html", "alertas.html"].includes(
    location.pathname.split("/").pop(),
  )
) {
  location.replace("./index.html");
} else {
  const machine = getMachines().find(
    (m) =>
      m.id ===
      (new URLSearchParams(location.search).get("id") ||
        new URLSearchParams(location.search).get("machine") ||
        user.machineId),
  );
  const machineAlerts = can(user, "viewAlerts")
    ? getAlerts().filter((a) => a.machineId === machine?.id)
    : [];
  renderNavigation(user, machineAlerts.length);
  if (machine && can(user, "viewMachines")) {
    setupReports(user, machine);
    let currentReadings = [];
    window.addEventListener("resize", () => {
      const chart = document.querySelector(".chart-wrap");
      if (chart) chart.innerHTML = temperatureChart(currentReadings);
    });
    async function load() {
      const dashboard = document.getElementById("dashboard");
      dashboard.setAttribute("aria-busy", "true");
      dashboard.innerHTML =
        '<div class="loading-state" role="status"><span class="spinner-border spinner-border-sm mx-auto" aria-hidden="true"></span>Carregando leituras da operação…</div>';
      try {
        currentReadings = await getReadings();
        renderDashboard(machine, machineAlerts, currentReadings);
        presentPage();
      } catch {
        dashboard.setAttribute("aria-busy", "false");
        dashboard.innerHTML =
          '<section class="panel state-panel" role="alert"><i class="bi bi-cloud-slash" aria-hidden="true"></i><h2 class="mt-3">Não foi possível carregar as leituras</h2><p>Verifique a conexão e tente novamente. Nenhuma leitura foi estimada.</p><button class="btn btn-primary" id="retry">Tentar novamente</button></section>';
        document.getElementById("retry").addEventListener("click", load);
      }
    }
    load();
  } else {
    document.getElementById("dashboard").setAttribute("aria-busy", "false");
    document.getElementById("dashboard").innerHTML =
      '<section class="panel state-panel"><h2>Nenhuma máquina atribuída</h2><p>Solicite a vinculação de um equipamento ao responsável pela unidade.</p></section>';
    document
      .querySelectorAll('[data-bs-target="#report-modal"]')
      .forEach((b) => (b.disabled = true));
  }
}
