import { users } from "./data/mock-users.js";
import { profiles } from "./permissions.js";
export function getUser() {
  try {
    const saved = JSON.parse(sessionStorage.getItem("agrosenseUser"));
    return (
      users.find((u) => u.id === saved?.id && u.role === saved?.role) ?? null
    );
  } catch {
    return null;
  }
}
export function login(email) {
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || !profiles[user.role]?.available)
    throw new Error(
      "Nesta etapa, use operador@agrosense.com. Os outros perfis ainda não estão disponíveis.",
    );
  sessionStorage.setItem("agrosenseUser", JSON.stringify(user));
  return user;
}
export function logout() {
  sessionStorage.removeItem("agrosenseUser");
  location.assign("./login.html");
}
