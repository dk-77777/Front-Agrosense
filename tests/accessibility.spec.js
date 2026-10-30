import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("acesso, painel e formulário sem violações automatizadas WCAG AA", async ({
  page,
}) => {
  const audit = async () =>
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  await page.goto("/login.html");
  await audit();
  await page.getByRole("button", { name: "Entrar na demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: "Unidade de moagem", exact: true }),
  ).toBeVisible();
  await audit();
  await page
    .getByRole("button", { name: "Reportar problema", exact: true })
    .click();
  await expect(page.getByLabel("O que aconteceu?")).toBeFocused();
  await audit();
});
