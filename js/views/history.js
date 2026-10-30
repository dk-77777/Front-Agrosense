import { getMachines } from "../data/store.js";
import { getReadings } from "../data/mock-readings.js";
import { temperatureChart } from "../ui/chart.js";
import { esc, format, table, empty } from "./shared.js";
export async function historyView(root) {
  const machines = getMachines();
  const points = await getReadings();
  root.innerHTML = `<form class="panel mb-3"><div class="row g-3"><div class="col-md-4"><label for="history-machine" class="form-label">Máquina</label><select id="history-machine" class="form-select">${machines.map((m) => `<option value="${esc(m.id)}">${esc(m.id)} · ${esc(m.name)}</option>`).join("")}</select></div><div class="col-md-4"><label class="form-label" for="start">Data inicial</label><input class="form-control" id="start" type="datetime-local" required value="2026-10-19T10:00"></div><div class="col-md-4"><label class="form-label" for="end">Data final</label><input class="form-control" id="end" type="datetime-local" required value="2026-10-19T10:30"></div></div><button class="btn btn-primary mt-3">Aplicar filtros</button> <button type="reset" class="btn btn-outline-secondary mt-3">Limpar filtros</button><p id="filter-error" role="alert" class="text-danger mt-2"></p></form><div id="history-results" aria-live="polite"></div>`;
  const render = () => {
    const start = new Date(root.querySelector("#start").value),
      end = new Date(root.querySelector("#end").value);
    if (start > end) {
      root.querySelector("#filter-error").textContent =
        "A data final deve ser posterior à inicial.";
      return;
    }
    root.querySelector("#filter-error").textContent = "";
    const machine = machines.find(
      (m) => m.id === root.querySelector("select").value,
    );
    const filtered =
      machine.id === "AG-001"
        ? points.filter((p) => {
            const date = new Date("2026-10-19T" + p.time);
            return date >= start && date <= end;
          })
        : [];
    root.querySelector("#history-results").innerHTML =
      `<section class="panel mb-3"><h2>Temperatura do processo</h2><p class="muted small-text">${esc(machine.id)} · Amostras simuladas de 19/10/2026</p>${filtered.length ? temperatureChart(filtered) : empty("Nenhuma leitura no período selecionado.")}</section><section class="panel">${table(
        ["Captura", "Processo", "Rotação", "Torque", "Resultado"],
        filtered
          .slice()
          .reverse()
          .map(
            (p) =>
              `<tr><td>19/10 · ${esc(p.time)}</td><td>${format(p.temperature)} °C</td><td>1.500 rpm</td><td>40,0 N m</td><td>${p.temperature >= 36 ? "Atenção" : "Normal"}</td></tr>`,
          )
          .join(""),
      )}<p class="small-text muted">${filtered.length} registros simulados encontrados.</p></section>`;
  };
  root.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    render();
  });
  root
    .querySelector("form")
    .addEventListener("reset", () => setTimeout(render, 0));
  render();
}
