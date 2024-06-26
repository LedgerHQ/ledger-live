import { test } from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { Token } from "../../enum/Token";
import { Transaction, TokenTransaction } from "../../models/Transaction";
import { specs } from "../../utils/speculos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

const transactions = [
  //TODO: Reactivate when fees will be stable
  //new Transaction(Account.tBTC_1, Account.tBTC_2, "0.00001", "medium"),
  new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", "medium"),
];

const transactionETH = [new Transaction(Account.ETH_1, Account.BTC_1, "0.00001", "medium")];

const transactionsToken = [
  new TokenTransaction(
    Account.ALGO_1,
    Account.ALGO_2,
    Account.ALGO_3,
    "0.1",
    "medium",
    Token.ALGO_USDT,
  ),
];

//Warning 🚨: Test may fail due to the GetAppAndVersion issue - Jira: LIVE-12581
for (const [i, transaction] of transactions.entries()) {
  test.describe("Send Approve", () => {
    test.use({
      userdata: "speculos-tests-app",
      testName: `sendApprove_${transaction.accountToDebit.currency.uiName}`,
      speculosCurrency: specs[transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(
      `[${transaction.accountToDebit.accountName}] send Approve`,
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-473",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);

        await app.account.clickSend();
        await app.send.fillTxInfo(transaction);
        await app.send.expectTxInfoValidity(transaction);
        await app.send.clickContinue();

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
      },
    );
  });
}

//This test might sporadically fail due to getAppAndVersion issue - Jira: LIVE-12581
for (const [i, transaction] of transactionsToken.entries()) {
  test.describe.parallel("Send token", () => {
    test.use({
      userdata: "speculos-subAccount",
      testName: `sendToken_${transaction.accountToDebit.currency.uiName}`,
      speculosCurrency: specs[transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`[${transaction.accountToCredit1.accountName}] send token`, async ({ page }) => {
      addTmsLink(["B2CQA-479"]);

      const app = new Application(page);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);
      await app.account.navigateToTokenInAccount(transaction.token);
      await app.account.clickSend();
      await app.send.fillRecipient(transaction.accountToCredit1.address);
      await app.send.checkErrorMessage();
      await app.send.fillRecipient(transaction.accountToCredit2.address);
      await app.send.checkContinueButtonEnable();
    });
  });
}

//This test might sporadically fail due to getAppAndVersion issue - Jira: LIVE-12581
for (const [i, transaction] of transactionETH.entries()) {
  test.describe.parallel("ETH input error", () => {
    test.use({
      userdata: "speculos-tests-app",
      testName: `ETH_input_error_${transaction.accountToDebit.currency.uiName}`,
      speculosCurrency: specs[transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`[${transaction.accountToDebit.accountName}] ETH input error`, async ({ page }) => {
      addTmsLink(["B2CQA-1904"]);

      const app = new Application(page);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);

      await app.account.clickSend();
      await app.send.fillRecipient(transaction.accountToCredit.address);
      await app.send.checkErrorMessage();
    });
  });
}
