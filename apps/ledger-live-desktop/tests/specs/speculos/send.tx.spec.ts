import test from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { Token } from "../../enum/Token";
import { Transaction, TokenTransaction } from "../../models/Transaction";
import { specs } from "../../utils/speculos";
import { Application } from "tests/page";
import { addTmsLink } from "tests/fixtures/common";

const transactions = [
  //TODO: Reactivate when fees will be stable
  //new Transaction(Account.tBTC_1, Account.tBTC_2, "0.00001", "medium"),
  new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", "medium"),
];

const transactionETH_BTC = [new Transaction(Account.ETH_1, Account.BTC_1, "0.00001", "medium")];

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

const transactionInputValid = [
  new Transaction(Account.ETH_1, Account.ETH_2, "send max", "medium"),
  new Transaction(Account.ETH_1, Account.ETH_2, "0.00001", "medium"),
];

const transactionsInputsInvalid = [
  //Todo: add Dot Delegating account - warningMessage: Polkadot all funds warning
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "", "medium"),
    expectedErrorMessage: null,
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "0", "medium"),
    expectedErrorMessage: null,
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_2, "1", "medium"),
    expectedErrorMessage: "Recipient address is inactive. Send at least 10 XRP to activate it",
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_2, "1.2", "medium"),
    expectedErrorMessage: "Balance cannot be below 1 DOT. Send max to empty account.",
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_3, "0.5", "medium"),
    expectedErrorMessage: "Recipient address is inactive. Send at least 1 DOT to activate it",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "100", "medium"),
    expectedErrorMessage: "Sorry, insufficient funds",
  },
];

//This tests might sporadically fail due to getAppAndVersion issue - Jira: LIVE-12581

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
      await app.send.clickContinueToDevice();

      await app.speculos.expectValidTxInfo(transaction);
      await app.send.expectTxSent();
      await app.account.expectTxInfos(transaction);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transaction.accountToCredit.accountName);
      await app.account.expectReceiver(transaction);
    });
  });
}

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
      await app.send.checkASAError();
      await app.send.fillRecipient(transaction.accountToCredit2.address);
      await app.send.checkContinueButtonEnable();
    });
  });
}

for (const [i, transaction] of transactionETH_BTC.entries()) {
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
      await app.send.checkInvalidAddressError(transaction);
    });
  });
}

for (const [i, transaction] of transactionsInputsInvalid.entries()) {
  test.describe.parallel("send test - invalid input", () => {
    test.use({
      userdata: "speculos-tests-app",
      testName: `Send_test_invalid_input_${transaction.transaction.accountToDebit.currency.uiName}`,
      speculosCurrency:
        specs[transaction.transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`[${transaction.expectedErrorMessage}] Send test - Invalid input (${transaction.transaction.accountToDebit.currency.uiName}) - ${i}`, async ({
      page,
    }) => {
      addTmsLink(["B2CQA-473"]);

      const app = new Application(page);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(
        transaction.transaction.accountToDebit.accountName,
      );

      await app.account.clickSend();
      await app.send.fillRecipient(transaction.transaction.accountToCredit.address);
      await app.send.clickContinue();
      await app.send.fillAmount(transaction.transaction);
      await app.send.checkErrorMessage(transaction.expectedErrorMessage);
      await app.send.checkContinueButtonDisabled();
    });
  });
}

for (const [i, transaction] of transactionInputValid.entries()) {
  test.describe.parallel("send test - valid input", () => {
    test.use({
      userdata: "speculos-tests-app",
      testName: `Send_test_valid_input_${transaction.accountToDebit.currency.uiName}`,
      speculosCurrency: specs[transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`[${transaction.amount}] Send test - Valid input`, async ({ page }) => {
      addTmsLink(["B2CQA-473-2"]); //Todo: separate valid and invalid cases in Jira

      const app = new Application(page);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);

      await app.account.clickSend();
      await app.send.fillRecipient(transaction.accountToCredit.address);
      await app.send.clickContinue();
      await app.send.fillAmount(transaction);
      await app.send.checkContinueButtonEnable();
    });
  });
}
