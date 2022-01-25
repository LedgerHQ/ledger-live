const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:8080/");
});

test("Page loads and runs", async ({ page }) => {
  const rootElement = page.locator("div#root, div#__next");
  await expect(rootElement).not.toBeEmpty();
  const flexElement = page.locator("div#root > div, div#__next > div");
});

test("Light theme", async ({ page }) => {
  const flexElement = page.locator("div#root > div, div#__next > div");
  await expect(flexElement).toHaveCSS("background-color", "rgb(255, 255, 255)");
  expect(await page.screenshot()).toMatchSnapshot("light.png");
});

test("Dark theme", async ({ page }) => {
  const flexElement = page.locator("div#root > div, div#__next > div");
  await page.click("input + div", { timeout: 1000 });
  await expect(flexElement).toHaveCSS("background-color", "rgb(0, 0, 0)");
  // Wait for the animation to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));
  expect(await page.screenshot()).toMatchSnapshot("dark.png");
});
