// One Bootstrap dialog shared by administrative forms. Escape/cancel never save.
export function confirmInactivation(subject) {
  if (document.getElementById("confirm-title")) return Promise.resolve(false);
  const trigger = document.activeElement;
  const disableTrigger = trigger?.tagName === "BUTTON";
  if (disableTrigger) trigger.disabled = true;
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.tabIndex = -1;
    modal.setAttribute("aria-labelledby", "confirm-title");
    modal.setAttribute("aria-describedby", "confirm-description");
    modal.innerHTML =
      '<div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h2 class="modal-title" id="confirm-title">Confirmar inativação</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cancelar inativação"></button></div><div class="modal-body"><p id="confirm-description"></p><p class="muted mt-2">O histórico será preservado. Você poderá reativar o cadastro depois.</p></div><div class="modal-footer"><button class="btn btn-outline-secondary" type="button" id="confirm-cancel" data-bs-dismiss="modal">Manter ativo</button><button class="btn btn-primary" type="button" id="confirm-accept">Confirmar inativação</button></div></div></div>';
    modal.querySelector("#confirm-description").textContent =
      `Deseja inativar ${subject}?`;
    document.body.append(modal);
    const instance = new bootstrap.Modal(modal);
    let accepted = false;
    modal.addEventListener(
      "shown.bs.modal",
      () => modal.querySelector("#confirm-cancel").focus(),
      { once: true },
    );
    modal.querySelector("#confirm-accept").addEventListener("click", () => {
      accepted = true;
      instance.hide();
    });
    modal.addEventListener(
      "hidden.bs.modal",
      () => {
        instance.dispose();
        modal.remove();
        if (disableTrigger) trigger.disabled = false;
        if (trigger?.isConnected) trigger.focus();
        resolve(accepted);
      },
      { once: true },
    );
    instance.show();
  });
}
export function saveFeedback(text) {
  sessionStorage.setItem("agrosenseFeedback", text);
}
export function showFeedback() {
  const text = sessionStorage.getItem("agrosenseFeedback");
  if (!text) return;
  sessionStorage.removeItem("agrosenseFeedback");
  const box = document.createElement("div");
  box.className = "save-feedback";
  box.setAttribute("role", "status");
  const message = document.createElement("span");
  message.textContent = text;
  const close = document.createElement("button");
  close.className = "btn-close";
  close.type = "button";
  close.setAttribute("aria-label", "Fechar confirmação");
  close.addEventListener("click", () => box.remove());
  box.append(message, close);
  document.getElementById("main").querySelector(".page-header").after(box);
}
