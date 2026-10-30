import { showFeedback } from "./ui/feedback.js";
import { profiles } from "./permissions.js";
import { brand, icon, escapeHTML } from "./ui/components.js";
import { logout } from "./auth.js";
export function renderNavigation(user, alertCount) {
  const profile = profiles[user.role];
  const page = location.pathname.split("/").pop() || "index.html";
  const parent =
    {
      "maquina.html": "maquinas.html",
      "cadastro-maquina.html": "maquinas.html",
      "cadastro-usuario.html": "usuarios.html",
      "alerta-reconhecido.html": "alertas.html",
    }[page] ?? page;
  showFeedback();
  document.getElementById("sidebar").innerHTML =
    `<div class="offcanvas-header"><a class="brand" href="./index.html" aria-label="AgroSense, painel">${brand}</a><button class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#sidebar" aria-label="Fechar menu"></button></div><div class="sidebar-brand"><a class="brand" href="./index.html" aria-label="AgroSense, painel">${brand}</a></div><div class="workspace-tag">${icon("buildings")}<div><strong>Unidade industrial 01</strong><small>Ambiente de demonstração</small></div></div><p class="nav-label">ESPAÇO DE TRABALHO</p><nav class="side-nav" aria-label="Navegação principal">${profile.navigation.map(([label, href, symbol], i) => `<a href="${href}" ${href.split("/").pop() === parent ? 'aria-current="page"' : ""}>${icon(symbol)}${label}${symbol === "bell" ? `<span class="nav-count">${alertCount}</span>` : ""}</a>`).join("")}</nav><div class="sidebar-bottom"><div class="demo-note">${icon("shield-check")}<strong>Operação em foco</strong>Informações essenciais para acompanhar sua máquina.</div><div class="user-block"><span class="avatar" aria-hidden="true">${escapeHTML(
      user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join(""),
    )}</span><div><div class="user-name">${escapeHTML(user.name)}</div><div class="user-role">${profile.label}</div></div><button class="logout" id="logout" aria-label="Sair da demonstração">${icon("box-arrow-right")}</button></div></div>`;
  document.getElementById("mobile-brand").innerHTML = brand;
  document.getElementById("logout").addEventListener("click", logout);
  document.querySelectorAll(".side-nav a").forEach((link) =>
    link.addEventListener("click", () => {
      document
        .querySelectorAll(".side-nav a")
        .forEach((a) => a.removeAttribute("aria-current"));
      link.setAttribute("aria-current", "location");
      bootstrap.Offcanvas.getInstance(
        document.getElementById("sidebar"),
      )?.hide();
    }),
  );
}
