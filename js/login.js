import { login } from "./auth.js";
import { brand } from "./ui/components.js";
document.getElementById("login-brand").innerHTML = brand;
document.getElementById("login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    login(document.getElementById("email").value);
    location.assign("./index.html");
  } catch (error) {
    const message = document.getElementById("login-error");
    message.hidden = false;
    message.textContent = error.message;
  }
});
