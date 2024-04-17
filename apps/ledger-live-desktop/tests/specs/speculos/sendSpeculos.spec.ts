import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountsPage } from "../../models/AccountsPage";
import { SendModal } from "../../models/SendModal";
import { SpeculosModal } from "../../models/SpeculosModal";

test.use({ userdata: "speculos" });
const currencies = ["Ethereum Holesky", "Ethereum"];
const addresses = {
  "Bitcoin": "bc1q7ezsfc44adw2gyzqjmwhuh2e83uk8u5hrw590r",
  "Bitcoin Testnet": "tb1q8kkh3hkwaq6frqrfdkhpmxzzhe5dtclzwlu4y9",
  "Ethereum": "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
  "Ethereum Holesky": "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad",
};

for (const currency of currencies) {
  test(`[${currency}] send @smoke`, async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const sendModal = new SendModal(page);
    const speculosModal = new SpeculosModal(page);

    await test.step(`Navigate to account`, async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName(`${currency} 1`);
    });

    await test.step(`send`, async () => {
      await page.getByRole("button", { name: "Send" }).click();
      await expect(page.getByText("Recipient address")).toBeVisible();
      const address = addresses[currency.split(" ")[0]];
      await sendModal.fillRecipient(address);
      await page.getByRole("button", { name: "continue" }).click();
      await page.locator('[data-test-id="modal-amount-field"]').fill("0,00001");
      await sendModal.countinueSendAmount();
      await expect(page.getByText("Total to debit")).toBeVisible();
      await page.getByRole("button", { name: "continue" }).click();
    });

    await test.step(`[${currency}] Validate or reject message`, async () => {
      await expect(page.getByText("Sign transaction on your Ledger Device")).toBeVisible();
      if (currency === "Bitcoin Testnet" || currency === "Ethereum Holesky") {
        await speculosModal.acceptTransaction();
        if (currency === "Ethereum Holesky") {
          await speculosModal.pressRight();
          await speculosModal.pressRight();
          await speculosModal.pressBoth();
        } else {
          await speculosModal.pressBoth();
        }
        await expect(page.getByText("Transaction sent")).toBeVisible();
        await expect.soft(sendModal.container).toHaveScreenshot(`validate.png`);
      } else {
        await speculosModal.rejectTransaction();
        if (currency === "ETH") {
          await speculosModal.pressRight();
          await speculosModal.pressRight();
          await speculosModal.pressBoth();
        } else {
          await speculosModal.pressBoth();
        }
        await expect(page.getByText("Operation denied on device")).toBeVisible();
        await expect.soft(sendModal.container).toHaveScreenshot(`denied.png`);
      }
    });
  });
}
