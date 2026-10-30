import { test, expect } from "@playwright/test";
async function login(page, role) {
  await page.goto("/login.html");
  await page.getByLabel("E-mail de demonstração").fill(role + "@agrosense.com");
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await expect(page).toHaveURL(/index.html/);
}
test("técnico consulta cinco máquinas, filtra e reconhece alerta", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page, "tecnico");
  await page.goto("/maquinas.html");
  await expect(page.getByText("5 máquinas encontradas")).toBeVisible();
  await page.getByLabel("Buscar máquina").fill("AG-004");
  await expect(page.getByText("1 máquinas encontradas")).toBeVisible();
  await page.getByRole("link", { name: "Ver detalhe" }).click();
  await expect(
    page.getByRole("heading", { name: "Elevador", exact: true }),
  ).toBeVisible();
  await page.goto("/alertas.html");
  await page
    .getByLabel("Observação (opcional)")
    .fill("Avaliação inicial registrada para inspeção.");
  await page
    .getByRole("button", { name: "Reconhecer alerta", exact: true })
    .click();
  await expect(page).toHaveURL(/alerta-reconhecido.html/);
  await expect(
    page.getByRole("heading", {
      name: "Ocorrência visualizada pela manutenção",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Observação: Avaliação inicial registrada para inspeção."),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Ocorrência visualizada pela manutenção",
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("administrador cadastra e identificadores repetidos são bloqueados", async ({
  page,
}) => {
  await login(page, "admin");
  await page.goto("/cadastro-maquina.html");
  await page.getByLabel("Identificador único").fill("AG-001");
  await page.getByLabel("Nome da máquina").fill("Teste");
  await page.getByRole("button", { name: "Salvar máquina" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Identificador já cadastrado" }),
  ).toBeVisible();
  await page.getByLabel("Identificador único").fill("AG-006");
  await page.getByRole("button", { name: "Salvar máquina" }).click();
  await expect(page).toHaveURL(/maquinas.html/);
  await expect(page.getByText("AG-006 · Teste")).toBeVisible();
  await page.reload();
  await expect(page.getByText("AG-006 · Teste")).toBeVisible();
  await page.goto("/alertas.html");
  await expect(
    page.getByRole("button", { name: "Reconhecer alerta", exact: true }),
  ).toHaveCount(0);
});
for (const role of ["operador", "tecnico", "gestor"])
  test(`${role} não acessa cadastro por URL`, async ({ page }) => {
    await login(page, role);
    await page.goto("/cadastro-maquina.html");
    await expect(
      page.getByRole("button", { name: "Salvar máquina" }),
    ).toHaveCount(0);
    if (role !== "operador")
      await expect(page.getByText(/Acesso restrito/)).toBeVisible();
  });
test("gestor consulta sem reconhecer e histórico filtra intervalo", async ({
  page,
}) => {
  await login(page, "gestor");
  await page.goto("/alertas.html");
  await expect(
    page.getByRole("button", { name: "Reconhecer alerta", exact: true }),
  ).toHaveCount(0);
  await page.goto("/historico.html");
  await expect(
    page.getByText("16 registros simulados encontrados."),
  ).toBeVisible();
  await page.getByLabel("Data inicial").fill("2026-10-20T10:00");
  await page.getByLabel("Data final").fill("2026-10-20T10:30");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(
    page.getByText("Nenhuma leitura no período selecionado."),
  ).toBeVisible();
});
for (const width of [390, 768, 1440])
  test(`telas adicionais responsivas ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await login(page, "tecnico");
    for (const file of ["maquinas.html", "historico.html", "alertas.html"]) {
      await page.goto("/" + file);
      await expect(page.locator("#dashboard")).toHaveAttribute(
        "aria-busy",
        "false",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/${file}-${width}.png`,
        fullPage: true,
      });
    }
  });
