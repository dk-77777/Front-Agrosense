import { test, expect } from "@playwright/test";
async function enter(page) {
  await page.goto("/login.html");
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: "Visão da operação" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Unidade de moagem", exact: true }),
  ).toBeVisible();
}
for (const width of [390, 768, 1024, 1366, 1440, 1920]) {
  test(`painel sem overflow e menu utilizável em ${width}px`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.setViewportSize({ width, height: 1000 });
    await enter(page);
    await expect(
      page.getByText("37,0", { exact: false }).first(),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width < 992) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await expect(page.getByRole("navigation")).toBeVisible();
    }
    await page.getByRole("link", { name: "Minha máquina" }).click();
    if (width < 992)
      await expect(page.locator("#sidebar")).not.toHaveClass(/show/);
    await expect(page).toHaveURL(/maquina.html/);
    await expect(
      page.getByRole("heading", { name: "Minha máquina", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Ver máquina", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/operator-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}
test("login, restrições de perfil e saída", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/login.html/);
  await page
    .getByLabel("E-mail de demonstração")
    .fill("inexistente@agrosense.com");
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "e-mails de demonstração",
  );
  await page
    .getByLabel("E-mail de demonstração")
    .fill("operador@agrosense.com");
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: "Visão da operação" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Reconhecer|Cadastrar|Encerrar|Editar/ }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Ver detalhes do alerta" }).click();
  await expect(page.locator("#alert-detail")).toContainText(
    "exclusiva do técnico",
  );
  await expect(page.getByRole("dialog")).toBeFocused();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Sair da demonstração" }).click();
  await expect(page).toHaveURL(/login.html/);
  await page.goto("/");
  await expect(page).toHaveURL(/login.html/);
});
test("relato validado, persistido e escapado", async ({ page }) => {
  await enter(page);
  await page
    .getByRole("button", { name: "Reportar problema", exact: true })
    .click();
  const textarea = page.getByLabel("O que aconteceu?");
  await expect(textarea).toBeFocused();
  await textarea.fill("          ");
  await page.getByRole("button", { name: "Salvar relato local" }).click();
  await expect(page.locator("#report-error")).toBeVisible();
  const message = "Ruído na moagem <img src=x onerror=alert(1)>";
  await textarea.fill(message);
  await page.getByRole("button", { name: "Salvar relato local" }).click();
  await expect(page.locator("#local-reports")).toContainText(message);
  await expect(page.locator("#local-reports img")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#local-reports")).toContainText(message);
});
test("erro de dados permite tentar novamente", async ({ page }) => {
  await page.route("**/readings.json", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/login.html");
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Não foi possível carregar as leituras",
    }),
  ).toBeVisible();
  await page.unroute("**/readings.json");
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    page.getByRole("heading", { name: "Tendência da temperatura" }),
  ).toBeVisible();
});
test("estado vazio não apresenta leituras atuais e mostra aviso offline", async ({
  page,
  context,
}) => {
  await page.route("**/readings.json", (route) => route.fulfill({ json: [] }));
  await enter(page);
  await expect(
    page
      .locator("#machine-section")
      .getByText("Sem atualização", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Nenhuma leitura recente", { exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await expect(page.locator("#connection-message")).toBeVisible();
});
test("dados corrompidos preservam texto e não sobrescrevem relatos", async ({
  page,
}) => {
  await enter(page);
  await page.evaluate(() => localStorage.setItem("agrosenseReports", "broken"));
  await page
    .getByRole("button", { name: "Reportar problema", exact: true })
    .click();
  await page
    .getByLabel("O que aconteceu?")
    .fill("Vibração durante o processamento");
  await page.getByRole("button", { name: "Salvar relato local" }).click();
  await expect(page.locator("#report-error")).toContainText(
    "Seu texto foi preservado",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("agrosenseReports")),
  ).toBe("broken");
});

test("navegação abre documentos próprios e preserva sessão ao recarregar", async ({
  page,
}) => {
  await enter(page);
  await page.getByRole("link", { name: "Minha máquina", exact: true }).click();
  await expect(page).toHaveURL(/maquina.html$/);
  await expect(
    page.getByRole("link", { name: "Minha máquina", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#alerts-section")).toHaveCount(0);
  await page.getByRole("link", { name: "Alertas 1", exact: true }).click();
  await expect(page).toHaveURL(/alertas.html$/);
  await expect(page.locator("#machine-section")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Alertas", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/alertas.html$/);
  await page.getByRole("link", { name: "Painel", exact: true }).click();
  await expect(page).toHaveURL(/index.html$/);
  await expect(
    page.getByRole("heading", { name: "Visão da operação" }),
  ).toBeVisible();
});
