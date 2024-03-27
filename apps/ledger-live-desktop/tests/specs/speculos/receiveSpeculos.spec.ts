import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { PortfolioPage } from "../../models/PortfolioPage";
import { AddAccountModal } from "../../models/AddAccountModal";
import { Layout } from "../../models/Layout";
import { AccountPage } from "../../models/AccountPage";
import { AccountsPage } from "../../models/AccountsPage";
import { ReceiveModal } from "../../models/ReceiveModal";

test.use({ userdata: "skip-onboarding" });
const currencies = ["btc"];

test.describe.parallel("Accounts @smoke", () => {
  for (const currency of currencies) {
    let firstAccountName = "NO ACCOUNT NAME YET";

    test(`[${currency}] Add account`, async ({ page }) => {
      const portfolioPage = new PortfolioPage(page);
      const addAccountModal = new AddAccountModal(page);
      const layout = new Layout(page);
      const accountsPage = new AccountsPage(page);
      const accountPage = new AccountPage(page);
      const receiveModal = new ReceiveModal(page);

      await test.step(`[${currency}] Open modal`, async () => {
        await portfolioPage.openAddAccountModal();
        expect(await addAccountModal.title.textContent()).toBe("Add accounts");
        await expect.soft(addAccountModal.container).toHaveScreenshot(`open-modal.png`);
      });

      await test.step(`[${currency}] Select currency`, async () => {
        await addAccountModal.select(currency);
        await page.mouse.move(0, 0); // prevent instability if select is hovered
        await expect.soft(addAccountModal.container).toHaveScreenshot(`${currency}-select.png`);
        await addAccountModal.continue();
      });

      await test.step(`[${currency}] Open device app`, async () => {
        await addAccountModal.waitForSync();
        const name = await addAccountModal.getFirstAccountName();
        if (typeof name === "string") {
          firstAccountName = name;
        }
        await expect
          .soft(addAccountModal.container)
          .toHaveScreenshot(`${currency}-accounts-list.png`);
      });

      await test.step(`[${currency}] Scan and add accounts`, async () => {
        await addAccountModal.addAccounts();
        await expect.soft(addAccountModal.container).toHaveScreenshot(`${currency}-success.png`);
      });

      await test.step(`[${currency}] Done`, async () => {
        await addAccountModal.done();
        await layout.totalBalance.waitFor({ state: "visible" });
      });

      await test.step(`Navigate to first account`, async () => {
        await layout.goToAccounts();
        await accountsPage.navigateToAccountByName(firstAccountName);
        await accountPage.settingsButton.waitFor({ state: "visible" });
        await expect.soft(page).toHaveScreenshot(`${currency}-firstAccountPage.png`);
      });

      await test.step(`receive`, async () => {
        await page.getByRole("button", { name: "receive" }).click();
        await page.getByRole("button", { name: "continue" }).click();
      });

      await test.step(`[${currency}] Receive`, async () => {
        //Ajouter methode pour prendre les screen et verifier que ca correspond
        await portfolioPage.openAddAccountModal();
        expect(await receiveModal.title.textContent()).toBe("Receive");
        await expect.soft(receiveModal.container).toHaveScreenshot(`Receive.png`);
      });

      // Verifier que l'address sur le spéculos correspond a l'address LL puis clicker sur done...
    });
  }
});
