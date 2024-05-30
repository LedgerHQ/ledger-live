import test from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { specs } from "../../utils/speculos";
import { Application } from "tests/page";

const accounts: Account[] = [
  // Derivation path is updated when account receive money
  Account.BTC_1,
  Account.ETH_1,
  Account.SOL_1,
  Account.TRX_1,
  Account.DOT_1,
  Account.XRP_1,
  Account.BCH_1,
  Account.ATOM_1,
  Account.XTZ_1,
];

//This test might sporadically fail due to getAppAndVersion issue - Jira: LIVE-12581
for (const [i, account] of accounts.entries()) {
  test.describe.parallel("Receive @smoke", () => {
    test.use({
      userdata: "speculos",
      testName: `receiveSpeculos_${account.currency.uiName}`,
      speculosCurrency: specs[account.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    //@TmsLink("B2CQA-249")

    test(`[${account.currency.uiName}] Receive`, async ({ page }) => {
      const app = new Application(page);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectAccountVisibility(account.accountName);

      await app.account.clickReceive();
      await app.modal.continue();
      await app.receive.expectValidReceiveAddress(account.address);

      await app.speculos.expectValidReceiveAddress(account);
      await app.receive.expectApproveLabel();
    });
  });
}
