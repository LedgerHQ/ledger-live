import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";
import { SendModal } from "../../models/SendModal";
import { Modal } from "../../models/Modal";
import { Currency } from "../../enum/Currency";
import { Device, specs, startSpeculos, stopSpeculos, pressRightUntil } from "../../utils/speculos";
import { addresses } from "../../enum/Address";

test.use({ userdata: "speculos" });
let device: Device | null;

const currencies: Currency[] = [Currency.tETH];

for (const currency of currencies) {
  test(`[${currency.uiName}] send @smoke`, async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);
    const sendModal = new SendModal(page);
    const modal = new Modal(page);
    device = await startSpeculos(test.name, specs[currency.uiName.replace(/ /g, "_")]);

    await test.step(`Navigate to account`, async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName(`${currency.uiName} 1`);
    });

    await test.step(`send`, async () => {
      await accountPage.sendButton.click();
      const address = addresses[currency.uiName];
      await sendModal.fillRecipient(address);
      await sendModal.continueButton.click();
      await modal.cryptoAmountField.fill("0,00001");
      await sendModal.countinueSendAmount();
      await expect(sendModal.verifyTotalDebit).toBeVisible();
      await sendModal.continueButton.click();
    });

    await test.step(`[${currency.uiName}] Validate or reject message`, async () => {
      await expect(sendModal.checkDevice).toBeVisible();
      if (currency === Currency.tBTC || currency === Currency.tETH) {
        console.log("Accept SITUATION");
        await pressRightUntil("Accept"); //TODO: Check if it's "Accept" or "Approve" => BTC Relou car Approve... (checker version nanoAPP)
        await expect(sendModal.checkTransactionbroadcast).toBeVisible();
        await expect.soft(sendModal.container).toHaveScreenshot(`validate.png`);
      } else {
        console.log("REJECT SITUATION");
        await pressRightUntil("Reject");
        await expect(sendModal.checkTransactionDenied).toBeVisible();
        await expect.soft(sendModal.container).toHaveScreenshot(`denied.png`);
      }
    });
  });
  test.afterAll(async () => {
    await stopSpeculos(device);
  });
}
