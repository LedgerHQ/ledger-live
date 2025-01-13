import { test, expect, chromium } from "@playwright/test";

test("Intern task", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("https://thinking-tester-contact-list.herokuapp.com/");

  await page.getByRole("button", { name: "Sign up" }).click();

  await page.fill("#firstName", "Victor");
  await page.fill("#lastName", "Alber");
  await page.fill("#email", "victor.alber@test.fr"); // Ameliorer ici pour recup address random
  await page.fill("#password", "password123");

  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.locator("text='Contact List'")).toBeVisible();

  await browser.close();
});

// Ameliorer les checks en général
