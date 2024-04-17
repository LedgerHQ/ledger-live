import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";
import { SendModal } from "../../models/SendModal";
import { SpeculosModal } from "../../models/SpeculosModal";
import { Modal } from "../../models/Modal";
import { Currency } from "../../enum/Currency";

test.use({ userdata: "speculos" });

const currencies: Currency[] = [Currency.tETH];

const addresses: { [key in Currency["uiName"]]: string } = {
  [Currency.BTC.uiName]: "bc1q7ezsfc44adw2gyzqjmwhuh2e83uk8u5hrw590r",
  [Currency.tBTC.uiName]: "tb1q8kkh3hkwaq6frqrfdkhpmxzzhe5dtclzwlu4y9",
  [Currency.ETH.uiName]: "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
  [Currency.tETH.uiName]: "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
  [Currency.SOL.uiName]: "TODO",
};

for (const currency of currencies) {
  test(`[${currency.uiName}] send @smoke`, async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);
    const sendModal = new SendModal(page);
    const speculosModal = new SpeculosModal(page);
    const modal = new Modal(page);

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
        await speculosModal.acceptTransaction();
        if (currency === Currency.tETH) {
          await speculosModal.pressRight();
          await speculosModal.pressRight();
          await speculosModal.pressBoth();
        } else {
          await speculosModal.pressBoth();
        }
        await expect(sendModal.checkTransactionbroadcast).toBeVisible();
        await expect.soft(sendModal.container).toHaveScreenshot(`validate.png`);
      } else {
        await speculosModal.rejectTransaction();
        if (currency === Currency.ETH) {
          await speculosModal.pressRight();
          await speculosModal.pressRight();
          await speculosModal.pressBoth();
        } else {
          await speculosModal.pressBoth();
        }
        await expect(sendModal.checkTransactionDenied).toBeVisible();
        await expect.soft(sendModal.container).toHaveScreenshot(`denied.png`);
      }
    });
  });
}
