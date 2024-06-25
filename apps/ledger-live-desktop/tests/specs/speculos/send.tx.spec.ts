import test from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { Transaction } from "../../models/Transaction";
import { specs } from "../../utils/speculos";
import { Application } from "tests/page";
import { addTmsLink } from "tests/fixtures/common";

const transactions = [
  //TODO: Reactivate when fees will be stable
  //new Transaction(Account.tBTC_1, Account.tBTC_2, "0.00001", "medium"),
  new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", "medium"),
];

//This test might sporadically fail due to getAppAndVersion issue - Jira: LIVE-12581
for (const [i, transaction] of transactions.entries()) {
  test.describe.parallel("Send Approve", () => {
    test.use({
      userdata: "speculos-tests-app",
      testName: `sendApprove_${transaction.accountToDebit.currency.uiName}`,
      speculosCurrency: specs[transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`[${transaction.accountToDebit.accountName}] send Approve`, async ({ page }) => {
      //Todo: add more currencies (Jira: QAA-122)
      addTmsLink(["B2CQA-507"]);
      const app = new Application(page);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);

      await app.account.clickSend();
      await app.send.fillTxInfo(transaction);
      await app.send.expectTxInfoValidity(transaction);
      await app.send.clickContinue();

      await app.speculos.expectValidTxInfo(transaction);
      await app.send.expectTxSent();
      await app.account.expectTxInfos(transaction);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transaction.accountToCredit.accountName);
      await app.account.expectReceiver(transaction);
    });
  });
}
