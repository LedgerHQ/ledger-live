import { test } from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { Token } from "../../enum/Token";
import { Fee } from "../../enum/Fee";
import { BasicTransaction, TokenTransaction } from "../../models/Transaction";
import { specs } from "../../utils/speculos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

const transaction = new BasicTransaction(
  Account.sep_ETH_1,
  Account.sep_ETH_2,
  "0.00001",
  Fee.MEDIUM,
);

const transactionETH_BTC = new BasicTransaction(
  Account.ETH_1,
  Account.BTC_1,
  "0.00001",
  Fee.MEDIUM,
);

const transactionsToken = new TokenTransaction(
  Account.ALGO_1,
  Account.ALGO_2,
  Account.ALGO_3,
  "0.1",
  Fee.MEDIUM,
  Token.ALGO_USDT,
);

const transactionInputValid = [
  new BasicTransaction(Account.ETH_1, Account.ETH_2, "send max", Fee.MEDIUM),
  new BasicTransaction(Account.ETH_1, Account.ETH_2, "0.00001", Fee.MEDIUM),
];

const transactionsInputsInvalid = [
  {
    transaction: new BasicTransaction(Account.ETH_1, Account.ETH_2, "", Fee.MEDIUM),
    expectedErrorMessage: null,
  },
  {
    transaction: new BasicTransaction(Account.ETH_1, Account.ETH_2, "0", Fee.MEDIUM),
    expectedErrorMessage: null,
  },
  {
    transaction: new BasicTransaction(Account.XRP_1, Account.XRP_2, "1", Fee.MEDIUM),
    expectedErrorMessage: "Recipient address is inactive. Send at least 10 XRP to activate it",
  },
  {
    transaction: new BasicTransaction(Account.DOT_1, Account.DOT_2, "1.2", Fee.MEDIUM),
    expectedErrorMessage: "Balance cannot be below 1 DOT. Send max to empty account.",
  },
  {
    transaction: new BasicTransaction(Account.DOT_1, Account.DOT_3, "0.5", Fee.MEDIUM),
    expectedErrorMessage: "Recipient address is inactive. Send at least 1 DOT to activate it",
  },
  {
    transaction: new BasicTransaction(Account.ETH_1, Account.ETH_2, "100", Fee.MEDIUM),
    expectedErrorMessage: "Sorry, insufficient funds",
  },
];

//Warning 🚨: Test may fail due to the GetAppAndVersion issue - Jira: LIVE-12581 or insufficient funds

test.describe("Send from 1 account to another", () => {
  test.use({
    userdata: "speculos-tests-app",
    testName: `sendApprove_${transaction.accountToDebit.currency.uiName}`,
    speculosCurrency: specs[transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
    speculosOffset: 0,
  });

  test(
    `Send [${transaction.accountToDebit.accountName}] to [${transaction.accountToCredit.accountName}]`,
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
      await app.send.clickContinueToDevice();

      await app.speculos.expectValidTxInfo(transaction);
      await app.send.expectTxSent();
      await app.account.navigateToViewDetails();
      await app.drawer.adressValueIsVisible(transaction.accountToDebit.address);
      await app.drawer.adressValueIsVisible(transaction.accountToCredit.address);
      await app.drawer.close();

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transaction.accountToCredit.accountName);
      await app.layout.syncAccounts();
      await app.account.clickOnLastOperation();
      await app.drawer.expectReceiverInfos(transaction);
    },
  );
});

test.describe("Send token (subAccount) from 1 account to another", () => {
  test.use({
    userdata: "speculos-subAccount",
    testName: `sendToken_${transactionsToken.accountToDebit.currency.uiName}`,
    speculosCurrency:
      specs[transactionsToken.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
    speculosOffset: 0,
  });

  test(
    `Send [${transactionsToken.accountToCredit1.accountName}] (${transactionsToken.token.tokenTicker}) to [${transactionsToken.accountToCredit2.accountName}]`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-479",
      },
    },
    async ({ app }) => {
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transactionsToken.accountToDebit.accountName);
      await app.account.navigateToTokenInAccount(transactionsToken.token);
      await app.account.clickSend();
      await app.send.fillRecipient(transactionsToken.accountToCredit1.address);
      await app.send.checkASAError();
      await app.send.fillRecipient(transactionsToken.accountToCredit2.address);
      await app.send.checkContinueButtonEnable();
      await app.layout.checkInputErrorNotVisible();
    },
  );
});

test.describe("Check ETH input error", () => {
  test.use({
    userdata: "speculos-tests-app",
    testName: `ETH_input_error_${transactionETH_BTC.accountToDebit.currency.uiName}`,
    speculosCurrency:
      specs[transactionETH_BTC.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
    speculosOffset: 0,
  });

  test(
    `Check [${transactionETH_BTC.accountToDebit.currency}] input error`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-1904",
      },
    },
    async ({ app }) => {
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transactionETH_BTC.accountToDebit.accountName);

      await app.account.clickSend();
      await app.send.fillRecipient(transactionETH_BTC.accountToCredit.address);
      await app.send.checkInvalidAddressError(transactionETH_BTC);
    },
  );
});

for (const [i, transaction] of transactionsInputsInvalid.entries()) {
  test.describe("Check error message for send test (invalid input)", () => {
    test.use({
      userdata: "speculos-tests-app",
      testName: `Send_test_invalid_input_${transaction.transaction.accountToDebit.currency.uiName}`,
      speculosCurrency:
        specs[transaction.transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(
      `Check [${transaction.expectedErrorMessage}] for [${transaction.transaction.accountToDebit.currency.uiName}] - Send test invalid input - ${i} `,
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-473",
        },
      },
      async ({ app }) => {
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(
          transaction.transaction.accountToDebit.accountName,
        );

        await app.account.clickSend();
        await app.send.fillRecipient(transaction.transaction.accountToCredit.address);
        await app.send.clickContinue();
        await app.send.fillAmount(transaction.transaction);
        await app.send.checkContinueButtonDisabled();
        await app.layout.checkErrorMessage(transaction.expectedErrorMessage);
      },
    );
  });
}

for (const [i, transaction] of transactionInputValid.entries()) {
  test.describe("Check valid input for send test", () => {
    test.use({
      userdata: "speculos-tests-app",
      testName: `Send_test_valid_input_${transaction.accountToDebit.currency.uiName}`,
      speculosCurrency: specs[transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(
      `Check Valid amount input [${transaction.amount}] for send tests`,
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-473",
        },
      },
      async ({ app }) => {
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);

        await app.account.clickSend();
        await app.send.fillRecipient(transaction.accountToCredit.address);
        await app.send.clickContinue();
        await app.send.fillAmount(transaction);
        await app.send.checkContinueButtonEnable();
        await app.layout.checkInputErrorNotVisible();
      },
    );
  });
}
