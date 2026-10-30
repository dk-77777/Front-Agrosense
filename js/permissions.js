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
      ["Painel", "#main", "grid"],
      ["Minha máquina", "#machine-section", "machine"],
      ["Alertas", "#alerts-section", "bell"],
    ],
  },
  TECHNICIAN: {
    label: "Técnico de manutenção",
    available: false,
    viewMachines: true,
    viewDetailedHistory: true,
    viewAlerts: true,
    acknowledgeAlert: true,
    createMachine: false,
    viewManagementIndicators: false,
  },
  MANAGER: {
    label: "Gestor",
    available: false,
    viewMachines: true,
    viewDetailedHistory: true,
    viewAlerts: true,
    acknowledgeAlert: false,
    createMachine: false,
    viewManagementIndicators: true,
  },
};
export const can = (user, action) => profiles[user?.role]?.[action] === true;
