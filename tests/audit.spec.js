import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function enter(page, role = "admin") {
  await page.goto("/login.html");
  await page.locator(`[data-demo-email="${role}@agrosense.com"]`).click();
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await page.locator("#dashboard[aria-busy=false]").waitFor();
}
test("atalhos de perfil e contexto de navegação", async ({ page }) => {
  await enter(page);
  await page.goto("/cadastro-usuario.html");
  await expect(
    page.getByRole("link", { name: "Usuários", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.goto("/cadastro-maquina.html");
  await expect(
    page.getByRole("link", { name: "Máquinas", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});
test("confirmação por Escape preserva formulário e dados", async ({ page }) => {
  await enter(page);
  await page.goto("/cadastro-maquina.html?id=AG-001");
  await page.getByLabel("Inativa", { exact: true }).check();
  await page.getByRole("button", { name: "Salvar máquina" }).click();
  await expect(
    page.getByRole("button", { name: "Manter ativo" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByLabel("Inativa", { exact: true })).toBeChecked();
  expect(
    await page.evaluate(() => localStorage.getItem("agrosenseMachines")),
  ).toBeNull();
});
test("datas inválidas e futuras nunca representam comunicação recente", async ({
  page,
}) => {
  await enter(page);
  const values = await page.evaluate(async () => {
    const { machineState } = await import("/js/data/condition.js");
    return ["invalid", "2030-01-01T00:00:00"].map(
      (lastReadingAt) => machineState({ lastReadingAt }).recent,
    );
  });
  expect(values).toEqual([false, false]);
});
test("auditoria visual e acessibilidade nas telas administrativas e operacionais", async ({
  page,
}) => {
  await enter(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of [
    "index.html",
    "maquinas.html",
    "historico.html",
    "alertas.html",
    "usuarios.html",
    "cadastro-usuario.html",
    "cadastro-maquina.html",
  ]) {
    await page.goto("/" + path);
    await page.locator("#dashboard[aria-busy=false]").waitFor();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations, `axe: ${path}`).toEqual([]);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        path + width,
      ).toBe(true);
      await page.screenshot({
        path: `test-results/audit-${path}-${width}.png`,
        fullPage: true,
      });
    }
  }
  expect(errors).toEqual([]);
});
