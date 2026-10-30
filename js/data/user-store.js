import { users } from "./mock-users.js";
import { can, profiles } from "../permissions.js";
export function getUsers() {
  const value = localStorage.getItem("agrosenseUsers");
  const all = value ? JSON.parse(value) : structuredClone(users);
  if (!Array.isArray(all)) throw Error("Cadastro de usuários inválido.");
  return all;
}
export function saveUser(record, actor) {
  if (!can(actor, "manageUsers")) throw Error("Acesso restrito.");
  const all = getUsers();
  const old = all.find((u) => u.id === record.id);
  const name = record.name.trim(),
    email = record.email.trim().toLowerCase();
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !profiles[record.role])
    throw Error("Informe nome, e-mail e perfil válidos.");
  if (all.some((u) => u.id !== record.id && u.email.toLowerCase() === email))
    throw Error("E-mail já cadastrado.");
  if (old?.id === actor.id && (!record.active || record.role !== "ADMIN"))
    throw Error(
      "Você não pode inativar ou remover o próprio perfil administrador.",
    );
  const next = {
    ...old,
    ...record,
    name,
    email,
    id: old?.id ?? crypto.randomUUID(),
  };
  localStorage.setItem(
    "agrosenseUsers",
    JSON.stringify(
      old ? all.map((u) => (u.id === next.id ? next : u)) : [...all, next],
    ),
  );
}
