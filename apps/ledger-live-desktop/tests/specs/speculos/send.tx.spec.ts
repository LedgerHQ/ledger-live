import test from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { Transaction } from "../../models/Transaction";
import { specs } from "../../utils/speculos";

// ONLY TESTNET (SEND WILL BE APPROVED ON DEVICE)
const transactions = [
  //TODO: Reactivate when fees will be stable
  //new Transaction(Account.tBTC_1, Account.tBTC_2, "0.00001", "medium"),
  new Transaction(Account.sep_ETH_1, Account.sep_ETH_2.address, "0.00001", "medium"),
];

//This test might sporadically fail due to getAppAndVersion issue - Jira: LIVE-12581
for (const [i, transaction] of transactions.entries()) {
  test.describe("Send Approve", () => {
    test.use({
      userdata: "speculos-tests-app",
      testName: `sendApprove_${transaction.accountToDebit.currency.uiName}`,
      speculosCurrency: specs[transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    //@TmsLink("TODO")

    test(`[${transaction.accountToDebit.accountName}] send Approve`, async ({ app }) => {
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);

      await app.account.clickSend();
      await app.send.fillTxInfo(transaction);
      await app.send.expectTxInfoValidity(transaction);
      await app.send.clickContinue();

      await app.speculos.expectValidTxInfo(transaction);
      await app.send.expectTxSent();
    });
  });
}
