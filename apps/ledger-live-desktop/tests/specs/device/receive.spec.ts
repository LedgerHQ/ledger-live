import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AddAccountModal } from "tests/models/AddAccountModal";
import { ReceiveModal } from "tests/models/ReceiveModal";
import { PortfolioPage } from "tests/models/PortfolioPage";
import { SpeculosDriver } from "tests/models/SpeculosDriver";

const currencies = [
  { appName: "Bitcoin", appVersion: "2.0.0", appDependency: undefined },
  // { appName: "Ethereum", appVersion: "2.0.0", appDependency: undefined },
];

test.describe.parallel("Add accounts & Receive", () => {
  for (const currency of currencies) {
    test.use({
      userdata: "skip-onboarding",
      env: {
        DISPLAY_SPECULOS: true,
        MOCK: undefined,
        MOCK_COUNTERVALUES: undefined,
      },
      speculosApp: {
        appName: currency.appName,
        appVersion: currency.appVersion,
        appDependency: currency.appDependency,
      },
    });

    test(`Currency: ${currency.appName}`, async ({ page, speculosApiContext }) => {
      const layout = new Layout(page);
      const portfolioPage = new PortfolioPage(page);
      const addAccountModal = new AddAccountModal(page);
      const receiveModal = new ReceiveModal(page);
      const device = new SpeculosDriver(speculosApiContext);

      await test.step(`must add a ${currency.appName} account`, async () => {
        await portfolioPage.openAddAccountModal();
        await addAccountModal.select(currency.appName);
        await addAccountModal.continue();
        await addAccountModal.waitForSync();
        await addAccountModal.addAccounts();
        await addAccountModal.done();
      });

      await test.step("Reject operation: must not display success screen", async () => {
        await layout.openReceiveModal();
        await receiveModal.continue();
        await receiveModal.waitForDevice();
        await device.pressRightButton();
        await device.pressRightButton();
        await device.pressRightButton();
        await device.pressRightButton();
        await device.pressBothButtons(); // -> Operation rejected
        await receiveModal.retry();
      });

      await test.step("Retry: displayed address must be the same on device", async () => {
        await receiveModal.waitForDevice();
        const displayedAddress = await receiveModal.verifyAddress.textContent();
        await device.pressRightButton();
        await device.pressRightButton();
        await device.pressRightButton();
        expect(await (await device.getLastEvents()).recipientAddress).toBe(displayedAddress);
      });

      await test.step("Clipboard: copied text must be the same on device", async () => {
        // clipboard api seems not to work with electron
        // await page.locator('receive-copy-address-button').click();
        // const clipText = await navigator.clipboard.readText();
        // expect(await (await device.getLastEvents()).recipientAddress).toBe(clipText);
      });

      await test.step("Approve operation: must display success screen", async () => {
        await device.pressBothButtons(); // -> Operation approved
        await receiveModal.done();
      });
    });
  }
});
