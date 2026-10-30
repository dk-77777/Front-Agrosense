import { getAlerts, getMachines, acknowledge } from "../data/store.js";
import { can } from "../permissions.js";
import { esc, table, empty, detailLink } from "./shared.js";
export function alertsView(root, user) {
  const machines = getMachines();
  let status = "Aberto",
    selected = null;
  root.innerHTML = `<div class="d-flex gap-2 flex-wrap mb-3" role="group" aria-label="Situação dos alertas">${["Aberto", "Reconhecido", "Encerrado"].map((s) => `<button class="btn btn-outline-secondary" data-status="${s}" aria-pressed="${s === status}">${s}</button>`).join("")}<label class="visually-hidden" for="alert-machine">Máquina</label><select class="form-select w-auto" id="alert-machine"><option value="">Todas as máquinas</option>${machines.map((m) => `<option>${esc(m.id)}</option>`).join("")}</select><label for="alert-start">De</label><input class="form-control w-auto" type="date" id="alert-start" value="2026-10-19"><label for="alert-end">Até</label><input class="form-control w-auto" type="date" id="alert-end" value="2026-10-19"></div><p id="period-error" role="alert" class="text-danger"></p><div class="row g-3"><section class="col-lg-6"><div class="panel"><h2 class="mb-3">Ocorrências do período</h2><div id="occurrences"></div></div></section><section class="col-lg-6"><div id="occurrence-detail" class="panel" aria-live="polite"></div></section></div>`;
  const selectedMachine = new URLSearchParams(location.search).get("machine");
  if (machines.some((m) => m.id === selectedMachine))
    root.querySelector("select").value = selectedMachine;
  const render = () => {
    const filter = root.querySelector("select").value;
    const start = root.querySelector("#alert-start").value,
      end = root.querySelector("#alert-end").value;
    root.querySelector("#period-error").textContent =
      start && end && start > end ? "Período inválido: corrija as datas." : "";
    const list = getAlerts().filter(
      (a) =>
        a.status === status &&
        (!filter || a.machineId === filter) &&
        !(start && end && start > end) &&
        (!start || (a.openedAt?.slice(0, 10) ?? "2026-10-19") >= start) &&
        (!end || (a.openedAt?.slice(0, 10) ?? "2026-10-19") <= end),
    );
    if (!list.some((a) => a.id === selected)) selected = list[0]?.id;
    root.querySelectorAll("[data-status]").forEach((b) => {
      const active = b.dataset.status === status;
      b.classList.toggle("btn-primary", active);
      b.classList.toggle("btn-outline-secondary", !active);
      b.setAttribute("aria-pressed", active);
    });
    root.querySelector("#occurrences").innerHTML = list.length
      ? table(
          ["Máquina / Ocorrência", "Situação", "Horário"],
          list
            .map(
              (a) =>
                `<tr><td><button class="btn btn-link p-0 text-start" data-alert="${a.id}" aria-pressed="${selected === a.id}">${esc(a.machineId)} · Condição de atenção</button></td><td>${a.status}</td><td>${a.time}</td></tr>`,
            )
            .join(""),
        )
      : empty("Nenhuma ocorrência nesta situação.");
    root.querySelectorAll("[data-alert]").forEach((b) =>
      b.addEventListener("click", () => {
        selected = b.dataset.alert;
        render();
      }),
    );
    const a = list.find((a) => a.id === selected),
      detail = root.querySelector("#occurrence-detail");
    if (!a) {
      detail.innerHTML = empty(
        "Selecione uma ocorrência para consultar os detalhes.",
      );
      return;
    }
    detail.innerHTML = `<span class="badge-status ${a.status === "Reconhecido" ? "normal" : "warning"}">${a.status === "Aberto" ? "Aguardando reconhecimento" : a.status}</span><h2 class="my-3">Condição de atenção</h2><p>${esc(a.machineId)} · ${esc(machines.find((m) => m.id === a.machineId)?.name ?? "")}</p><dl class="data-list my-3"><div><dt>Identificador</dt><dd>${a.id}</dd></div><div><dt>Origem</dt><dd>Modelo experimental</dd></div><div><dt>Modelo</dt><dd>Demonstração v1</dd></div></dl><p class="mb-3">Analise as leituras e avalie a necessidade de inspeção. O alerta não determina reparo ou parada automática.</p>${can(user, "acknowledgeAlert") && a.status === "Aberto" ? '<form id="ack-form"><label for="observation" class="form-label">Observação (opcional)</label><textarea id="observation" class="form-control" maxlength="1000" placeholder="Registrar avaliação inicial"></textarea><p id="ack-error" class="text-danger" role="alert"></p><button class="btn btn-primary w-100 my-2">Reconhecer alerta</button></form>' : a.status === "Reconhecido" ? `<a class="btn btn-primary w-100 mb-2" href="./alerta-reconhecido.html?id=${a.id}">Ver reconhecimento</a>` : '<p class="status-note mb-3">Reconhecimento exclusivo do técnico de manutenção.</p>'}<a class="btn btn-outline-secondary w-100" href="${detailLink(a.machineId)}">Ver máquina</a>`;
    detail.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!can(user, "acknowledgeAlert")) return;
      try {
        acknowledge(a.id, user, detail.querySelector("textarea").value.trim());
        location.assign("./alerta-reconhecido.html?id=" + a.id);
      } catch (e) {
        detail.querySelector("#ack-error").textContent = e.message;
      }
    });
  };
  root.querySelectorAll("[data-status]").forEach((b) =>
    b.addEventListener("click", () => {
      status = b.dataset.status;
      render();
    }),
  );
  root.querySelector("select").addEventListener("change", render);
  root
    .querySelectorAll("input[type=date]")
    .forEach((input) => input.addEventListener("change", render));
  render();
}
export function recognizedView(root) {
  const a = getAlerts().find(
    (a) => a.id === new URLSearchParams(location.search).get("id"),
  );
  if (!a || !a.acknowledgedAt) {
    root.innerHTML =
      empty("Nenhum reconhecimento encontrado para esta ocorrência.") +
      '<a href="./alertas.html">Voltar aos alertas</a>';
    return;
  }
  root.innerHTML = `<section class="panel mb-3" style="background:var(--color-green-tint)"><span class="badge-status normal">Reconhecido</span><h2 class="mt-3">Ocorrência visualizada pela manutenção</h2><p>Situação do episódio: ${esc(a.status)}${a.closedAt ? ` · Encerrado em ${esc(a.closedAt)}` : ""}</p><p class="mt-2">Reconhecer um alerta registra sua visualização, sem encerrar o episódio. Uma análise posterior normal encerra o episódio. A avaliação e a intervenção na máquina continuam sob responsabilidade da equipe técnica.</p></section><section class="panel"><dl class="data-list"><div><dt>Ocorrência</dt><dd>${a.id}</dd></div><div><dt>Equipamento</dt><dd>${esc(a.machineId)}</dd></div><div><dt>Origem</dt><dd>Modelo experimental</dd></div></dl><h2 class="my-3">Reconhecido por ${esc(a.acknowledgedBy)}</h2><p>${esc(new Date(a.acknowledgedAt).toLocaleString("pt-BR"))}</p><p class="my-3 report-copy">Observação: ${esc(a.observation || "Nenhuma observação registrada.")}</p><a class="btn btn-primary" href="./alertas.html">Voltar aos alertas</a> <a class="btn btn-outline-secondary" href="${detailLink(a.machineId)}">Ver máquina</a></section><section class="panel mt-3"><h2>Histórico da ocorrência</h2><p class="mt-3">${a.time} · Condição de atenção identificada na amostra simulada.</p><p>${esc(new Date(a.acknowledgedAt).toLocaleString("pt-BR"))} · Reconhecimento registrado pelo técnico neste navegador.</p></section>`;
}
