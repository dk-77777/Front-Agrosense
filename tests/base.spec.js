import { test, expect } from "@playwright/test";
async function login(page, role = "admin") {
  await page.goto("/login.html");
  await page.getByLabel("E-mail de demonstração").fill(role + "@agrosense.com");
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await expect(page).toHaveURL(/index.html/);
}
test("operador acessa histórico e links preservam máquina", async ({
  page,
}) => {
  await login(page, "operador");
  await page.goto("/maquina.html?id=AG-002");
  await expect(
    page.getByRole("heading", { name: "Transportador", exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Histórico da máquina" }).click();
  await expect(page.locator("#history-machine")).toHaveValue("AG-002");
  await page.reload();
  await expect(page.locator("#history-machine")).toHaveValue("AG-002");
  await page.goto("/maquina.html?id=AG-002");
  await page.getByRole("link", { name: "Alertas da máquina" }).click();
  await expect(page.locator("#alert-machine")).toHaveValue("AG-002");
  await expect(
    page.getByRole("button", { name: "Reconhecer alerta", exact: true }),
  ).toHaveCount(0);
});
test("máquina edita, confirma inativação e preserva registros", async ({
  page,
}) => {
  await login(page);
  await page.goto("/cadastro-maquina.html?id=AG-001");
  await expect(page.getByLabel("Identificador único")).toHaveValue("AG-001");
  await page.getByLabel("Nome da máquina").fill("Moagem revisada");
  await page.getByLabel("Inativa", { exact: true }).check();

  await page.getByRole("button", { name: "Salvar máquina" }).click();
  await expect(
    page.getByRole("button", { name: "Manter ativo" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Manter ativo" }).click();
  await expect(page).toHaveURL(/cadastro-maquina/);

  await page.getByRole("button", { name: "Salvar máquina" }).click();
  await page
    .getByRole("button", { name: "Confirmar inativação", exact: true })
    .click();
  await expect(
    page.getByText("AG-001 · Moagem revisada · Inativa"),
  ).toBeVisible();
  await page.goto("/historico.html?machine=AG-001");
  await expect(
    page.getByText("16 registros simulados encontrados."),
  ).toBeVisible();
});
test("usuário cria, edita perfil e inativa sem excluir", async ({ page }) => {
  await login(page);
  await page.goto("/cadastro-usuario.html");
  await page.getByLabel("Nome completo").fill("Pessoa de teste");
  await page.getByLabel("E-mail", { exact: true }).fill("teste@agrosense.com");
  await page.getByLabel("Perfil", { exact: true }).selectOption("MANAGER");
  await page.getByRole("button", { name: "Salvar usuário" }).click();
  const row = page.getByRole("row").filter({ hasText: "teste@agrosense.com" });
  await expect(row).toContainText("Gestor");
  await row.getByRole("link", { name: "Editar usuário" }).click();
  await page.getByLabel("Usuário ativo").uncheck();

  await page.getByRole("button", { name: "Salvar usuário" }).click();
  await page
    .getByRole("button", { name: "Confirmar inativação", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "teste@agrosense.com" }),
  ).toContainText("Inativo");
  await page.getByRole("button", { name: "Sair da demonstração" }).click();
  await page.getByLabel("E-mail de demonstração").fill("teste@agrosense.com");
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await expect(page.locator("#login-error")).toBeVisible();
});
for (const role of ["operador", "tecnico", "gestor"])
  test(`${role} sem gestão de usuários`, async ({ page }) => {
    await login(page, role);
    await page.goto("/cadastro-usuario.html");
    await expect(page.getByText(/Acesso restrito/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Salvar usuário" }),
    ).toHaveCount(0);
  });
test("separa comunicação e análise sem ocultar leituras disponíveis", async ({
  page,
}) => {
  await login(page, "tecnico");
  await page.evaluate(() =>
    localStorage.setItem(
      "agrosenseMachines",
      JSON.stringify([
        {
          id: "AG-001",
          name: "Teste",
          status: "normal",
          temperature: 37,
          rotation: 1500,
          torque: 40,
          updatedAt: "10:30:05",
          analysisState: "unavailable",
          unit: "01",
          sector: "Linha 01",
        },
      ]),
    ),
  );
  await page.goto("/maquina.html?id=AG-001");
  await expect(page.getByText("Dados recentes", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Análise indisponível", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Estado do monitoramento" })
      .getByText("Não determinada", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("37,0", { exact: false }).first()).toBeVisible();
});
test("limite de 30 segundos e reconhecimento não encerram episódio", async ({
  page,
}) => {
  await login(page, "tecnico");
  const states = await page.evaluate(async () => {
    const { machineState } = await import("/js/data/condition.js");
    return [
      machineState({ updatedAt: "10:29:35" }).recent,
      machineState({ updatedAt: "10:29:34" }).recent,
    ];
  });
  expect(states).toEqual([true, false]);
  await page.goto("/alertas.html");
  await page
    .getByRole("button", { name: "Reconhecer alerta", exact: true })
    .click();
  await expect(page).toHaveURL(/alerta-reconhecido/);
  const status = await page.evaluate(async () => {
    const s = await import("/js/data/store.js");
    const before = s.getAlerts().find((a) => a.id === "ALT-001").status;
    s.recordAnalysis("AG-001", "normal", "2026-10-19T10:32:00");
    return [before, s.getAlerts().find((a) => a.id === "ALT-001").status];
  });
  expect(status).toEqual(["Reconhecido", "Encerrado"]);
});
test("gestor tem prioridades e administrador tem cadastros", async ({
  page,
}) => {
  await login(page, "gestor");
  await expect(
    page.getByRole("heading", { name: "Prioridades da operação" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Equipamentos com mais ocorrências" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair da demonstração" }).click();
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Gestão de cadastros" }),
  ).toBeVisible();
});
