import { confirmInactivation, saveFeedback } from "../ui/feedback.js";
import { getUsers, saveUser } from "../data/user-store.js";
import { profiles, can } from "../permissions.js";
import { getMachines } from "../data/store.js";
import { esc, table, empty } from "./shared.js";
export function usersView(root, user) {
  if (!can(user, "manageUsers")) return;
  root.innerHTML = `<a class="btn btn-primary mb-3" href="./cadastro-usuario.html">Novo usuário</a><section class="panel"><h2 class="mb-3">Usuários cadastrados</h2>${table(
    ["Nome / e-mail", "Perfil", "Situação", "Ação"],
    getUsers()
      .map(
        (u) =>
          `<tr><td>${esc(u.name)}<br><span class="muted">${esc(u.email)}</span></td><td>${profiles[u.role]?.label ?? "Não definido"}</td><td>${u.active === false ? "Inativo" : "Ativo"}</td><td><a class="btn btn-outline-secondary" href="./cadastro-usuario.html?id=${encodeURIComponent(u.id)}">Editar usuário</a></td></tr>`,
      )
      .join(""),
  )}</section>`;
}
export function userForm(root, user) {
  if (!can(user, "manageUsers")) return;
  const id = new URLSearchParams(location.search).get("id");
  const old = id ? getUsers().find((u) => u.id === id) : null;
  if (id && !old) {
    root.innerHTML = empty("Usuário não encontrado.");
    return;
  }
  document.querySelector("h1").textContent = old
    ? "Editar usuário"
    : "Cadastrar usuário";
  root.innerHTML = `<form class="panel"><h2 class="mb-3">${old ? "Editar" : "Cadastrar"} usuário</h2><div class="row g-3"><div class="col-md-6"><label class="form-label" for="user-name">Nome completo</label><input class="form-control" id="user-name" required maxlength="100" value="${esc(old?.name ?? "")}"></div><div class="col-md-6"><label class="form-label" for="user-email">E-mail</label><input class="form-control" type="email" id="user-email" required value="${esc(old?.email ?? "")}"></div><div class="col-md-6"><label class="form-label" for="user-role">Perfil</label><select class="form-select" id="user-role">${Object.entries(
    profiles,
  )
    .map(
      ([key, p]) =>
        `<option value="${key}" ${old?.role === key ? "selected" : ""}>${p.label}</option>`,
    )
    .join(
      "",
    )}</select></div><div class="col-md-6"><label class="form-label" for="assigned-machine">Máquina de preferência (operador)</label><select class="form-select" id="assigned-machine"><option value="">Sem preferência</option>${getMachines()
    .map(
      (m) =>
        `<option value="${esc(m.id)}" ${old?.machineId === m.id ? "selected" : ""}>${esc(m.id)} · ${esc(m.name)}</option>`,
    )
    .join(
      "",
    )}</select></div><div class="col-12"><label><input id="user-active" type="checkbox" ${old?.active !== false ? "checked" : ""}> Usuário ativo</label></div></div><p class="status-note mt-3">Cadastro de demonstração, sem senha. Usuários inativos não podem iniciar ou manter uma sessão. Histórico e registros existentes são preservados.</p><p id="user-error" role="alert" class="text-danger"></p><button class="btn btn-primary mt-3">Salvar usuário</button> <a class="btn btn-outline-secondary mt-3" href="./usuarios.html">Cancelar</a></form>`;
  root.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const active = root.querySelector("#user-active").checked;
    if (
      old?.active !== false &&
      !active &&
      !(await confirmInactivation(`o usuário ${old?.name ?? "informado"}`))
    )
      return;
    try {
      saveUser(
        {
          id: old?.id,
          name: root.querySelector("#user-name").value,
          email: root.querySelector("#user-email").value,
          role: root.querySelector("#user-role").value,
          active,
          machineId: root.querySelector("#assigned-machine").value,
        },
        user,
      );
      saveFeedback(
        "Cadastro salvo neste navegador. Nenhum dado foi enviado ao servidor.",
      );
      location.assign("./usuarios.html");
    } catch (error) {
      root.querySelector("#user-error").textContent = error.message;
    }
  });
}
