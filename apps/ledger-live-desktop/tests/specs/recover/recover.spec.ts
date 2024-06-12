import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { RecoverRestorePage } from "../../page/recover.restore.page";
import { DeviceModelId } from "@ledgerhq/types-devices";

test.use({
  userdata: "skip-onboarding",
  env: { MOCK_NO_BYPASS: "1" },
});

test.describe.parallel("Recover @smoke", () => {
  test("Restore page with no device", async ({ page }) => {
    const recoverPage = new RecoverRestorePage(page);
    await recoverPage.useDeepLink();

    await test.step("Text is visible", async () => {
      await expect(recoverPage.connectText).toBeVisible();
    });
  });

  test("Restore page with nanoX", async ({ page }) => {
    const recoverPage = new RecoverRestorePage(page);
    await recoverPage.useDeepLink();

    await test.step("Text is visible", async () => {
      await expect(recoverPage.connectText).toBeVisible();
    });

    const modelId = DeviceModelId.nanoX;
    await page.evaluate(modelId => {
      window.ledger.addDevice({
        deviceId: "",
        deviceName: "My nanoX",
        modelId,
        wired: true,
      });
    }, modelId);

    await test.step("Text is no longer visible", async () => {
      await expect(recoverPage.connectText).not.toBeVisible();
    });
  });

  test("Restore page with nanoSP", async ({ page }) => {
    const recoverPage = new RecoverRestorePage(page);
    await recoverPage.useDeepLink();

    await test.step("Text is visible", async () => {
      await expect(recoverPage.connectText).toBeVisible();
    });

    const modelId = DeviceModelId.nanoSP;
    await page.evaluate(modelId => {
      window.ledger.addDevice({
        deviceId: "",
        deviceName: "My nanoSP",
        modelId,
        wired: true,
      });
    }, modelId);

    await test.step("Text is no longer visible", async () => {
      await expect(recoverPage.connectText).not.toBeVisible();
    });
  });

  test("Restore page with stax", async ({ page }) => {
    const recoverPage = new RecoverRestorePage(page);
    await recoverPage.useDeepLink();

    await test.step("Text is visible", async () => {
      await expect(recoverPage.connectText).toBeVisible();
    });

    const modelId = DeviceModelId.stax;
    await page.evaluate(modelId => {
      window.ledger.addDevice({
        deviceId: "",
        deviceName: "My stax",
        modelId,
        wired: true,
      });
    }, modelId);

    await test.step("Text is no longer visible", async () => {
      await expect(recoverPage.connectText).not.toBeVisible();
    });
  });
});
