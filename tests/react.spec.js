const { test, expect } = require("@playwright/test");

test("Page loads and runs", async ({ page }) => {
  await page.goto("http://localhost:8080/");
  const rootElement = page.locator("div#root");
  await expect(rootElement).not.toBeEmpty();
  const flexElement = page.locator("div#root > div");
  await expect(flexElement).toHaveCSS("background-color", "rgb(255, 255, 255)");
  expect(await page.screenshot()).toMatchSnapshot("light.png");
  await page.click("input + div", { timeout: 1000 });
  await expect(flexElement).toHaveCSS("background-color", "rgb(0, 0, 0)");
  // Wait for the animation to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));
  expect(await page.screenshot()).toMatchSnapshot("dark.png");
});
