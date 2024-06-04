import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../component/layout.component";

test.use({ userdata: "skip-onboarding" });

test.use({
  env: {
    MOCK_OS_VERSION: "Windows_NT@6.1.7601",
  },
});

test("Unsupported OS", async ({ page }) => {
  const layout = new Layout(page);
  await test.step("displays the error page", async () => {
    await layout.renderError.waitFor({ state: "visible" });
    await expect(layout.renderError).toBeVisible();
    await expect(page).toHaveScreenshot("error-os-unsupported.png", {
      clip: { x: 0, y: 0, width: 1024, height: 400 },
      mask: [layout.appVersion],
    });
  });
});
