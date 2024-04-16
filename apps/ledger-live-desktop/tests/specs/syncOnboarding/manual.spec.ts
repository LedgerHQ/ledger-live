import { expect } from "@playwright/test";
import test from "../../fixtures/common";
import { OnboardingPage } from "../../models/OnboardingPage";
import { DeviceModelId } from "@ledgerhq/devices";
test.use({
  featureFlags: { supportDeviceStax: { enabled: true } },
  env: { MOCK_NO_BYPASS: "1" },
});

const modelIds = [
  DeviceModelId.nanoS,
  DeviceModelId.nanoSP,
  DeviceModelId.nanoX,
  DeviceModelId.stax,
];

for (const modelId of modelIds) {
  test.describe.parallel(`[${modelId}] SyncOnboarding with stax selected`, () => {
    test(`[${modelId}] Manual @smoke`, async ({ page }) => {
      const onboardingPage = new OnboardingPage(page);

      await page.evaluate(id => {
        window.ledger.addDevice({
          deviceId: "42",
          deviceName: `Ledger test ${id}`,
          modelId: id as DeviceModelId,
          wired: true,
        });
      }, modelId);

      await test.step(`[${modelId}] Get started`, async () => {
        await onboardingPage.getStarted();
      });

      await test.step(`[${modelId}] Select stax device`, async () => {
        await onboardingPage.selectDevice("stax");
      });

      await test.step(`[${modelId}] Take screenshot of main screen`, async () => {
        await expect(page).toHaveScreenshot(`sync-onboarding-manual-${modelId}.png`);
      });
    });
  });
}
