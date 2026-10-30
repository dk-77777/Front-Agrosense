// Compose dedicated documents from shared operator components.
export function presentPage() {
  const page = location.pathname.split("/").pop();
  const dashboard = document.getElementById("dashboard");
  if (page === "alertas.html") {
    const alerts = dashboard.querySelector("#alerts-section");
    dashboard.replaceChildren(alerts);
    alerts.classList.remove("alert-list");
  } else if (page === "maquina.html") {
    dashboard.querySelector(".attention-banner")?.remove();
    dashboard.querySelector("#alerts-section")?.remove();
    const detail = document.createElement("section");
    detail.className = "panel mt-4";
    detail.setAttribute("aria-label", "Detalhes do equipamento");
    detail.innerHTML = document.getElementById("machine-detail").innerHTML;
    dashboard.append(detail);
  } else {
    const link = dashboard.querySelector(".operation-panel button");
    if (link) {
      const anchor = document.createElement("a");
      anchor.className = link.className;
      anchor.href =
        "./maquina.html?id=" +
        encodeURIComponent(
          document
            .querySelector("#machine-section .machine-id")
            .textContent.split("·")
            .at(-1)
            .trim(),
        );
      anchor.innerHTML = link.innerHTML;
      link.replaceWith(anchor);
    }
  }
}
