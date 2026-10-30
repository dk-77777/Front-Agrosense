import { can } from "../permissions.js";
import { machines as initialMachines } from "./mock-machines.js";
import { alerts as initialAlerts } from "./mock-alerts.js";
const fleet = [
  ...initialMachines,
  ...["Transportador", "Misturador", "Elevador", "Secador"].map((name, i) => ({
    ...initialMachines[0],
    id: `AG-00${i + 2}`,
    name,
    status: i === 2 ? "offline" : "normal",
    temperature: 32 + i,
    updatedAt: `10:${i === 2 ? "18" : "30"}:0${4 - i}`,
    lastCommunicationMinutes: i === 2 ? 12 : 0,
  })),
];
function read(key, fallback) {
  const value = localStorage.getItem(key);
  if (!value) return structuredClone(fallback);
  const result = JSON.parse(value);
  if (!Array.isArray(result)) throw Error("Dados locais inválidos.");
  return result;
}
export const getMachines = () => read("agrosenseMachines", fleet);
export const getAlerts = () =>
  read("agrosenseAlerts", [
    ...initialAlerts,
    {
      ...initialAlerts[0],
      id: "ALT-002",
      machineId: "AG-002",
      status: "Encerrado",
      time: "09:42:10",
    },
  ]);
export function addMachine(machine) {
  const all = getMachines();
  if (all.some((m) => m.id.toLowerCase() === machine.id.toLowerCase()))
    throw Error("Identificador já cadastrado.");
  localStorage.setItem("agrosenseMachines", JSON.stringify([...all, machine]));
}
export function acknowledge(id, user, observation) {
  if (!can(user, "acknowledgeAlert"))
    throw Error("Reconhecimento exclusivo do técnico.");
  const all = getAlerts();
  const alert = all.find((a) => a.id === id);
  if (!alert || alert.status !== "Aberto")
    throw Error("Este alerta não está aberto.");
  Object.assign(alert, {
    status: "Reconhecido",
    acknowledgedBy: user.name,
    acknowledgedAt: new Date().toISOString(),
    observation,
  });
  localStorage.setItem("agrosenseAlerts", JSON.stringify(all));
}

export function updateMachine(record, actor) {
  if (!can(actor, "createMachine")) throw Error("Acesso restrito.");
  const all = getMachines();
  const old = all.find((m) => m.id === record.id);
  if (!old || !record.name.trim()) throw Error("Máquina inválida.");
  const next = {
    ...old,
    name: record.name.trim(),
    description: record.description,
    active: record.active,
  };
  localStorage.setItem(
    "agrosenseMachines",
    JSON.stringify(all.map((m) => (m.id === next.id ? next : m))),
  );
}
// Normal analyses close the episode; acknowledgement alone never closes it.
export function recordAnalysis(machineId, result, at) {
  if (!["normal", "warning"].includes(result))
    throw Error("Resultado inválido.");
  const all = getAlerts();
  const open = all.find(
    (a) => a.machineId === machineId && a.status !== "Encerrado",
  );
  if (result === "normal" && open) {
    open.status = "Encerrado";
    open.closedAt = at;
  } else if (result === "warning" && open) open.lastOccurrenceAt = at;
  else if (result === "warning")
    all.push({
      id: crypto.randomUUID(),
      machineId,
      status: "Aberto",
      time: at.slice(11, 19),
      openedAt: at,
      title: "Condição de atenção",
      description: "Condição identificada pela análise.",
    });
  localStorage.setItem("agrosenseAlerts", JSON.stringify(all));
}
