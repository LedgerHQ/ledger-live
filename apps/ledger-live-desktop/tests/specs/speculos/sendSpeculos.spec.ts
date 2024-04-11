import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AccountsPage } from "../../models/AccountsPage";
import { SendModal } from "../../models/SendModal";
import { SpeculosModal } from "../../models/SpeculosModal";
import path from "path";

test.use({
  userdata: "speculos",
  simulateCamera: path.join(
    __dirname,
    "../../userdata/",
    "qrcode-19qAJ5F2eH7CRPFfj5c94x22zFcXpa8rZ77.y4m",
  ),
});

//BTC Testnet: "tb1q8kkh3hkwaq6frqrfdkhpmxzzhe5dtclzwlu4y9"
//Holesky : "0x43047a5023D55a8658Fcb1c1Cea468311AdAA3Ad"

const currencies = ["Bitcoin Testnet"];

for (const currency of currencies) {
  const accountName = "Bitcoin Testnet 1"; //A changer

  test(`[${currency}] send`, async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const sendModal = new SendModal(page);
    const speculosModal = new SpeculosModal(page);

    await test.step(`Navigate to account`, async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName(accountName);
      await expect.soft(page).toHaveScreenshot(`${currency}-firstAccountPage.png`);
    });
    // FAIRE LES EXPECT...
    await test.step(`send`, async () => {
      await page.getByRole("button", { name: "Send" }).click();
      await expect(page.getByText("Recipient address")).toBeVisible();
      await sendModal.fillRecipient("tb1q8kkh3hkwaq6frqrfdkhpmxzzhe5dtclzwlu4y9"); //A changer
      await page.getByRole("button", { name: "continue" }).click();
      await page.locator('[data-test-id="modal-amount-field"]').fill("0,00001");
      await sendModal.countinueSendAmount();
      await page.getByRole("button", { name: "continue" }).click();
      //await expect(page.getByText("Total to debit")).toBeVisible();
      //await expect.soft(addAccountModal.container).toHaveScreenshot(`${currency}-fromTo.png`);
    });

    //Faire une methode qui approve quand je suis en testnet ?

    await test.step(`[${currency}] Validate message`, async () => {
      await expect(page.getByText("Sign transaction on your Ledger Device")).toBeVisible();
      //await speculosModal.automationMethodReject();
      await speculosModal.pressRight();
      await speculosModal.pressRight();
      await speculosModal.pressRight();
      await speculosModal.pressRight();
      if (currency === "ETH") {
        await speculosModal.pressRight();
        await speculosModal.pressBoth();
      } else {
        await speculosModal.pressBoth();
      }
      await expect(page.getByText("Operation denied on device")).toBeVisible();
      await expect.soft(sendModal.container).toHaveScreenshot(`denied.png`);
    });
  });
}
