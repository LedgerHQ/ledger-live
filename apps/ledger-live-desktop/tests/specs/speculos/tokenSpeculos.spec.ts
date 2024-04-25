import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { PortfolioPage } from "../../models/PortfolioPage";
import { AddAccountModal } from "../../models/AddAccountModal";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { AccountsPage } from "../../models/AccountsPage";
import { Device, specs, startSpeculos, stopSpeculos } from "../../utils/speculos";
import { Currency } from "../../enum/Currency";

test.use({ userdata: "skip-onboarding" });
const currencies = [Currency.ETH];

let device: Device | undefined;

test.afterEach(async () => {
  await stopSpeculos(device);
});

test.describe.parallel("Accounts @smoke", () => {
  for (const currency of currencies) {
    let firstAccountName = "NO ACCOUNT NAME YET";
    test(`[${currency.uiName}] Add account with token`, async ({ page }) => {
      const portfolioPage = new PortfolioPage(page);
      const addAccountModal = new AddAccountModal(page);
      const layout = new Layout(page);
      const accountsPage = new AccountsPage(page);
      const accountPage = new AccountPage(page);
      device = await startSpeculos(test.name, specs[currency.uiName.replace(/ /g, "_")]);

      await test.step(`[${currency.uiName}] Open modal`, async () => {
        await portfolioPage.openAddAccountModal();
        expect(await addAccountModal.title.textContent()).toBe("Add accounts");
      });

      await test.step(`[${currency.uiName}] Select currency`, async () => {
        await addAccountModal.select(currency.uiName);
        await page.mouse.move(0, 0); // prevent instability if select is hovered
        await addAccountModal.continue();
      });

      await test.step(`[${currency.uiName}] Open device app`, async () => {
        await addAccountModal.waitForSync();
        const name = await addAccountModal.getFirstAccountName();
        firstAccountName = name;
      });

      await test.step(`[${currency.uiName}] Scan and add accounts`, async () => {
        await addAccountModal.addAccounts();
      });

      await test.step(`[${currency.uiName}] Done`, async () => {
        await addAccountModal.done();
        await layout.totalBalance.waitFor({ state: "visible" });
      });

      await test.step(`Navigate to first account`, async () => {
        await layout.goToAccounts();
        await accountsPage.navigateToAccountByName(firstAccountName);
        await accountPage.settingsButton.waitFor({ state: "visible" });
      });

      await test.step(`Check Token`, async () => {
        await accountPage.scrollToTokens();
        await expect.soft(page).toHaveScreenshot(`${currency.uiName}-token.png`);
      });
    });
  }
});
