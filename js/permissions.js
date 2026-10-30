export const profiles = {
  OPERATOR: {
    label: "Operador de máquinas",
    available: true,
    viewMachines: true,
    viewDetailedHistory: false,
    viewAlerts: true,
    acknowledgeAlert: false,
    createMachine: false,
    viewManagementIndicators: false,
    navigation: [
      ["Painel", "./index.html", "grid"],
      ["Minha máquina", "./maquina.html", "machine"],
      ["Alertas", "./alertas.html", "bell"],
    ],
  },
  TECHNICIAN: {
    label: "Técnico de manutenção",
    available: true,
    viewMachines: true,
    viewFleet: true,
    navigation: [
      ["Painel", "./index.html", "grid"],
      ["Máquinas", "./maquinas.html", "machine"],
      ["Histórico", "./historico.html", "graph-up"],
      ["Alertas", "./alertas.html", "bell"],
    ],
    viewDetailedHistory: true,
    viewAlerts: true,
    acknowledgeAlert: true,
    createMachine: false,
    viewManagementIndicators: false,
  },
  MANAGER: {
    label: "Gestor",
    available: true,
    viewMachines: true,
    viewFleet: true,
    navigation: [
      ["Painel", "./index.html", "grid"],
      ["Máquinas", "./maquinas.html", "machine"],
      ["Histórico", "./historico.html", "graph-up"],
      ["Alertas", "./alertas.html", "bell"],
    ],
    viewDetailedHistory: true,
    viewAlerts: true,
    acknowledgeAlert: false,
    createMachine: false,
    viewManagementIndicators: true,
  },
};
profiles.ADMIN = {
  ...profiles.TECHNICIAN,
  label: "Administrador",
  acknowledgeAlert: false,
  createMachine: true,
};
export const can = (user, action) => profiles[user?.role]?.[action] === true;
