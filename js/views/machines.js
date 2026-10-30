import { confirmInactivation, saveFeedback } from "../ui/feedback.js";
import { machineState } from "../data/condition.js";
import { getMachines, addMachine, updateMachine } from "../data/store.js";
import { can } from "../permissions.js";
import { esc, statusBadge, detailLink, table, empty } from "./shared.js";
export function machinesView(root, user) {
  root.innerHTML = `<div class="row g-3 mb-4 align-items-end"><div class="col-md-6"><label class="form-label" for="search">Buscar máquina</label><input id="search" class="form-control" placeholder="Identificador ou nome"></div><div class="col-md-3"><label class="form-label" for="condition">Situação</label><select id="condition" class="form-select"><option value="">Todas as situações</option value="normal">Normal</option><option value="warning">Atenção</option><option value="offline">Sem atualização</option></select></div>${can(user, "createMachine") ? '<div class="col-md-3"><a class="btn btn-primary" href="./cadastro-maquina.html">Nova máquina</a></div>' : ""}</div><section class="panel" id="machine-results" aria-live="polite"></section><aside class="panel mt-3"><h2>Cadastro disponível ao administrador</h2><p class="muted mt-2">Consultas e alterações respeitam o perfil de acesso. Os dados desta demonstração ficam neste navegador.</p></aside>`;
  const render = () => {
    const query = root
      .querySelector("#search")
      .value.toLocaleLowerCase("pt-BR");
    const status = root.querySelector("#condition").value;
    const all = getMachines().filter(
      (m) =>
        (m.id + " " + m.name).toLocaleLowerCase("pt-BR").includes(query) &&
        (!status ||
          (status === "offline"
            ? !machineState(m).recent
            : machineState(m).condition === status)),
    );
    root.querySelector("#machine-results").innerHTML =
      table(
        [
          "Identificador e nome",
          "Comunicação",
          "Análise",
          "Condição",
          "Última leitura",
          "Ação",
        ],
        all
          .map(
            (m) =>
              `<tr><td>${esc(m.id)} · ${esc(m.name)}${m.active === false ? " · Inativa" : ""}</td><td>${machineState(m).communication}</td><td>${machineState(m).analysisLabel}</td><td>${machineState(m).condition === "unknown" ? "Não determinada" : statusBadge(machineState(m).condition)}</td><td>${esc(m.updatedAt)}</td><td><a class="btn btn-outline-secondary" href="${detailLink(m.id)}">Ver detalhe</a>${can(user, "createMachine") ? ` <a class="btn btn-outline-secondary" href="./cadastro-maquina.html?id=${encodeURIComponent(m.id)}">Editar máquina</a>` : ""}</td></tr>`,
          )
          .join(""),
      ) +
      (all.length
        ? `<p class="muted small-text">${all.length} máquinas encontradas</p>`
        : empty());
  };
  root.querySelector("#search").addEventListener("input", render);
  root.querySelector("#condition").addEventListener("change", render);
  render();
}
export function createView(root, user) {
  if (!can(user, "createMachine")) return false;
  const editId = new URLSearchParams(location.search).get("id");
  const old = editId ? getMachines().find((m) => m.id === editId) : null;
  if (editId && !old) {
    root.innerHTML = empty("Máquina não encontrada.");
    return;
  }
  root.innerHTML = `<form class="panel" id="create-form"><h2 class="mb-4">Informações do equipamento</h2><div class="row g-3"><div class="col-md-6"><label for="identifier" class="form-label">Identificador único</label><input id="identifier" class="form-control" required maxlength="30" pattern="[A-Za-z0-9-]+" placeholder="AG-006"></div><div class="col-md-6"><label for="machine-name" class="form-label">Nome da máquina</label><input id="machine-name" class="form-control" required maxlength="100"></div><div class="col-12"><label for="description" class="form-label">Descrição</label><textarea id="description" class="form-control" maxlength="500" placeholder="Localização e observações do equipamento"></textarea></div><fieldset class="col-12"><legend class="fs-6">Situação</legend><label class="me-4"><input type="radio" name="active" value="true" checked> Ativa</label><label><input type="radio" name="active" value="false"> Inativa</label></fieldset></div><p class="muted border-top pt-3 mt-3">O identificador será utilizado para associar as mensagens à máquina correta.</p><p class="text-danger" id="save-error" role="alert"></p><button class="btn btn-primary mt-3">Salvar máquina</button> <a href="./maquinas.html" class="btn btn-outline-secondary mt-3">Cancelar</a></form><aside class="panel mt-3"><h2>Antes de salvar</h2><p class="muted mt-2">Identificador e nome são obrigatórios. Identificadores repetidos serão bloqueados. Cadastro local demonstrativo, sem envio ao servidor.</p></aside>`;
  if (old) {
    root.querySelector("#identifier").value = old.id;
    root.querySelector("#identifier").readOnly = true;
    root.querySelector("#machine-name").value = old.name;
    root.querySelector("#description").value = old.description ?? "";
    root.querySelector(
      `[name=active][value="${old.active !== false}"]`,
    ).checked = true;
    document.querySelector("h1").textContent = "Editar máquina";
  }
  root.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!can(user, "createMachine")) return;
    try {
      const id = root.querySelector("#identifier").value.trim().toUpperCase(),
        name = root.querySelector("#machine-name").value.trim();
      if (!id || !name) throw Error("Preencha identificador e nome.");
      const active =
        root.querySelector("[name=active]:checked").value === "true";
      if (
        old?.active !== false &&
        !active &&
        !(await confirmInactivation(`a máquina ${old?.name ?? name}`))
      )
        return;
      if (old) {
        updateMachine(
          {
            id,
            name,
            description: root.querySelector("#description").value.trim(),
            active,
          },
          user,
        );
        saveFeedback(
          "Cadastro salvo neste navegador. Nenhum dado foi enviado ao servidor.",
        );
        location.assign("./maquinas.html");
        return;
      }
      addMachine({
        id,
        name,
        description: root.querySelector("#description").value.trim(),
        active: root.querySelector("[name=active]:checked").value === "true",
        status: "offline",
        updatedAt: "Sem leitura",
        unit: "Unidade industrial 01",
        sector: "Não informado",
        lastCommunicationMinutes: Infinity,
      });
      saveFeedback(
        "Cadastro salvo neste navegador. Nenhum dado foi enviado ao servidor.",
      );
      location.assign("./maquinas.html");
    } catch (e) {
      root.querySelector("#save-error").textContent = e.message;
    }
  });
  return true;
}
