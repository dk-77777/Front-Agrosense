export const icons = {
  grid: "grid-1x2",
  machine: "gear-wide-connected",
  bell: "bell",
  arrow: "arrow-up-right",
  report: "chat-left-text",
  clock: "clock",
  temperature: "thermometer-half",
  rotation: "speedometer2",
  torque: "activity",
};
export const icon = (name) =>
  `<i class="bi bi-${icons[name] ?? name}" aria-hidden="true"></i>`;
export const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const brand = `<svg class="brand-mark" viewBox="0 0 36 40" fill="none" aria-hidden="true"><path d="M18 36V21M18 27C7 28 3 20 4 10c10-1 16 5 14 17ZM18 21C17 11 24 4 33 4c1 10-5 17-15 17Z" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span>AgroSense<span style="color:var(--color-brand)">.</span></span>`;
export const statusBadge = (status) => {
  const values = {
    warning: ["exclamation-triangle", "Atenção"],
    normal: ["check-circle", "Normal"],
    offline: ["dash-circle", "Sem atualização"],
  };
  const [symbol, label] = values[status] ?? values.offline;
  return `<span class="badge-status ${status in values ? status : "offline"}">${icon(symbol)} ${label}</span>`;
};
export const format = (value, digits = 1) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
export function sensorCard({
  label,
  value,
  unit,
  symbol,
  note,
  warning = false,
}) {
  return `<div class="col-12 col-sm-6 col-xl-4"><article class="panel sensor-card"><div class="sensor-heading"><h3>${label}</h3>${icon(symbol)}</div><p class="sensor-value">${value}<span>${unit}</span></p><p class="sensor-foot ${warning ? "warning-value" : ""}">${icon(warning ? "exclamation-circle" : "check-circle")}${note}</p></article></div>`;
}
export function notify(message) {
  document.getElementById("toast-message").textContent = message;
  bootstrap.Toast.getOrCreateInstance(
    document.getElementById("app-toast"),
  ).show();
}
