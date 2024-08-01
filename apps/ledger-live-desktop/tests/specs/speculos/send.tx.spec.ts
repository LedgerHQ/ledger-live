import { test } from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { Fee } from "../../enum/Fee";
import { Transaction } from "../../models/Transaction";
import { specs } from "../../utils/speculos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

const transactionsInputsInvalid = [
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "", Fee.MEDIUM),
    expectedErrorMessage: null,
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "0", Fee.MEDIUM),
    expectedErrorMessage: null,
  },
  {
    transaction: new Transaction(Account.XRP_1, Account.XRP_2, "1", Fee.MEDIUM),
    expectedErrorMessage: "Recipient address is inactive. Send at least 10 XRP to activate it",
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_2, "1.2", Fee.MEDIUM),
    expectedErrorMessage: "Balance cannot be below 1 DOT. Send max to empty account.",
  },
  {
    transaction: new Transaction(Account.DOT_1, Account.DOT_3, "0.5", Fee.MEDIUM),
    expectedErrorMessage: "Recipient address is inactive. Send at least 1 DOT to activate it",
  },
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2, "100", Fee.MEDIUM),
    expectedErrorMessage: "Sorry, insufficient funds",
  },
];

//Warning 🚨: Test may fail due to the GetAppAndVersion issue - Jira: LIVE-12581 or insufficient funds

test.describe("Send from 1 account to another", () => {
  const transaction = new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", Fee.MEDIUM);

  test.use({
    userdata: "speculos-tests-app",
    testName: `sendApprove_${transaction.accountToDebit.currency.name}`,
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
      await app.drawer.addressValueIsVisible(transaction.accountToDebit.address);
      await app.drawer.addressValueIsVisible(transaction.accountToCredit.address);
      await app.drawer.close();

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transaction.accountToCredit.accountName);
      await app.layout.syncAccounts();
      await app.account.clickOnLastOperation();
      await app.drawer.expectReceiverInfos(transaction);
    },
  );
});

test.describe("Send token (subAccount) - invalid input", () => {
  const tokenTransactionInvalid = {
    transaction: new Transaction(Account.ALGO_USDT_1, Account.ALGO_USDT_2, "0.1", Fee.MEDIUM),
    expectedErrorMessage: "Recipient account has not opted in the selected ASA.",
  };

  test.use({
    userdata: "speculos-subAccount",
    testName: `sendToken_invalid_input_${tokenTransactionInvalid.transaction.accountToDebit.currency.name}`,
    speculosCurrency:
      specs[
        tokenTransactionInvalid.transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")
      ],
    speculosOffset: 0,
  });

  test(
    `Send [${tokenTransactionInvalid.transaction.accountToCredit.accountName}] to [${tokenTransactionInvalid.transaction.accountToCredit.accountName}] - invalid input`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-479",
      },
    },
    async ({ app }) => {
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(
        tokenTransactionInvalid.transaction.accountToDebit.accountName,
      );
      await app.account.navigateToTokenInAccount(
        tokenTransactionInvalid.transaction.accountToDebit,
      );
      await app.account.clickSend();
      await app.send.fillRecipient(tokenTransactionInvalid.transaction.accountToCredit.address);
      await app.send.checkContinueButtonDisabled();
      await app.layout.checkErrorMessage(tokenTransactionInvalid.expectedErrorMessage);
    },
  );
});

test.describe("Send token (subAccount) - valid input", () => {
  const tokenTransactionValid = new Transaction(
    Account.ALGO_USDT_1,
    Account.ALGO_USDT_3,
    "0.1",
    Fee.MEDIUM,
  );

  test.use({
    userdata: "speculos-subAccount",
    testName: `sendToken_valid_input_${tokenTransactionValid.accountToDebit.currency.name}`,
    speculosCurrency:
      specs[tokenTransactionValid.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
    speculosOffset: 0,
  });

  test(
    `Send [${tokenTransactionValid.accountToCredit.accountName}] to [${tokenTransactionValid.accountToCredit.accountName}] - valid input`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-479",
      },
    },
    async ({ app }) => {
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(tokenTransactionValid.accountToDebit.accountName);
      await app.account.navigateToTokenInAccount(tokenTransactionValid.accountToDebit);
      await app.account.clickSend();
      await app.send.fillRecipient(tokenTransactionValid.accountToCredit.address);
      await app.send.checkContinueButtonEnable();
      await app.layout.checkInputErrorNotVisible();
    },
  );
});

test.describe("Check invalid address input error", () => {
  const transactionInvalidAddress = new Transaction(
    Account.ETH_1,
    Account.BTC_1,
    "0.00001",
    Fee.MEDIUM,
  );

  test.use({
    userdata: "speculos-tests-app",
    testName: `Invalid_address_input_error_${transactionInvalidAddress.accountToDebit.currency.name}`,
    speculosCurrency:
      specs[transactionInvalidAddress.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
    speculosOffset: 0,
  });

  test(
    `Check [${transactionInvalidAddress.accountToDebit.currency}] invalid address input error`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-1904",
      },
    },
    async ({ app }) => {
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(
        transactionInvalidAddress.accountToDebit.accountName,
      );

      await app.account.clickSend();
      await app.send.fillRecipient(transactionInvalidAddress.accountToCredit.address);
      await app.send.checkInvalidAddressError(transactionInvalidAddress);
    },
  );
});

for (const [i, transaction] of transactionsInputsInvalid.entries()) {
  test.describe("Check invalid amount input error", () => {
    test.use({
      userdata: "speculos-tests-app",
      testName: `Invalid_amount_input_error_${transaction.transaction.accountToDebit.currency.name}`,
      speculosCurrency:
        specs[transaction.transaction.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(
      `Check [${transaction.expectedErrorMessage}] for [${transaction.transaction.accountToDebit.currency.name}] - invalid amount input error - ${i} `,
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
        await app.send.fillAmount(transaction.transaction.amount);
        await app.send.checkContinueButtonDisabled();
        await app.layout.checkErrorMessage(transaction.expectedErrorMessage);
      },
    );
  });
}

test.describe("Verify send max user flow", () => {
  const transactionInputValid = new Transaction(
    Account.ETH_1,
    Account.ETH_2,
    "send max",
    Fee.MEDIUM,
  );

  test.use({
    userdata: "speculos-tests-app",
    testName: `Verify_send_max_user_flow_${transactionInputValid.accountToDebit.currency.name}`,
    speculosCurrency:
      specs[transactionInputValid.accountToDebit.currency.deviceLabel.replace(/ /g, "_")],
    speculosOffset: 0,
  });

  test(
    `Check Valid amount input [${transactionInputValid.amount}] for send tests`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-473",
      },
    },
    async ({ app }) => {
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transactionInputValid.accountToDebit.accountName);

      await app.account.clickSend();
      await app.send.fillRecipient(transactionInputValid.accountToCredit.address);
      await app.send.clickContinue();
      await app.send.fillAmount(transactionInputValid.amount);
      await app.send.checkContinueButtonEnable();
      await app.layout.checkInputErrorNotVisible();
    },
  );
});
