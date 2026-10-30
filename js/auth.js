import { getUsers } from "./data/user-store.js";
import { profiles } from "./permissions.js";
export function getUser() {
  try {
    const saved = JSON.parse(sessionStorage.getItem("agrosenseUser"));
    return (
      getUsers().find((u) => u.id === saved?.id && u.active !== false) ?? null
    );
  } catch {
    return null;
  }
}
export function login(email) {
  const user = getUsers().find((u) => u.email === email.trim().toLowerCase());
  if (!user || user.active === false || !profiles[user.role]?.available)
    throw new Error(
      "Use um dos e-mails de demonstração informados na tela de acesso.",
    );
  sessionStorage.setItem("agrosenseUser", JSON.stringify(user));
  return user;
}
export function logout() {
  sessionStorage.removeItem("agrosenseUser");
  location.assign("./login.html");
}
