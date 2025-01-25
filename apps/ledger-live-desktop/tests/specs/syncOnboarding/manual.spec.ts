import { expect } from "@playwright/test";
import test from "../../fixtures/common";
import { OnboardingPage } from "../../page/onboarding.page";
import { DeviceModelId } from "@ledgerhq/devices";

test.use({
  env: { MOCK_NO_BYPASS: "1" },
  settings: { hasSeenAnalyticsOptInPrompt: false },
});

const modelIds = [
  DeviceModelId.nanoS,
  DeviceModelId.nanoSP,
  DeviceModelId.nanoX,
  DeviceModelId.stax,
];

for (const modelId of modelIds) {
  test.describe.parallel(`[${modelId}] SyncOnboarding`, () => {
    test(`[${modelId}] Manual @smoke`, async ({ page }) => {
      const onboardingPage = new OnboardingPage(page);

      await page.evaluate((id: DeviceModelId) => {
        window.ledger.addDevice({
          deviceId: "42",
          deviceName: `Ledger test ${id}`,
          modelId: id,
          wired: true,
        });
      }, modelId);

      await test.step(`[${modelId}] Get started`, async () => {
        await onboardingPage.getStarted();
      });

      await test.step(`[${modelId}] Select stax device`, async () => {
        await onboardingPage.selectDevice(modelId as "nanoS" | "nanoX" | "nanoSP" | "stax");
      });

      await test.step(`[${modelId}] Take screenshot of main screen`, async () => {
        await expect(page).toHaveScreenshot(`sync-onboarding-manual-${modelId}.png`);
      });
    });
  });
}
