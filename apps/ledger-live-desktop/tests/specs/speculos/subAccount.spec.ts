import { test } from "../../fixtures/common";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";
import { getEnv } from "@ledgerhq/live-env";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { TransactionStatus } from "@ledgerhq/live-common/e2e/enum/TransactionStatus";

const subAccounts = [
  { account: Account.ETH_USDT_1, xrayTicket1: "B2CQA-2577, B2CQA-1079", xrayTicket2: "B2CQA-2583" },
  { account: Account.XLM_USCD, xrayTicket1: "B2CQA-2579", xrayTicket2: "B2CQA-2585" },
  { account: Account.ALGO_USDT_1, xrayTicket1: "B2CQA-2575", xrayTicket2: "B2CQA-2581" },
  { account: Account.TRX_USDT, xrayTicket1: "B2CQA-2580", xrayTicket2: "B2CQA-2586" },
  { account: Account.BSC_BUSD_1, xrayTicket1: "B2CQA-2576", xrayTicket2: "B2CQA-2582" },
  { account: Account.POL_DAI_1, xrayTicket1: "B2CQA-2578", xrayTicket2: "B2CQA-2584" },
];

const subAccountReceive = [
  { account: Account.ETH_USDT_1, xrayTicket: "B2CQA-2492" },
  { account: Account.ETH_LIDO, xrayTicket: "B2CQA-2491" },
  { account: Account.TRX_USDT, xrayTicket: "B2CQA-2496" },
  { account: Account.BSC_BUSD_1, xrayTicket: "B2CQA-2489" },
  { account: Account.BSC_SHIBA, xrayTicket: "B2CQA-2490" },
  { account: Account.POL_DAI_1, xrayTicket: "B2CQA-2493" },
  { account: Account.POL_UNI, xrayTicket: "B2CQA-2494" },
];

for (const token of subAccounts) {
  test.describe("Add subAccount without parent", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: token.account.currency.speculosApp,
    });

    test(
      `Add Sub Account without parent (${token.account.currency.speculosApp.name}) - ${token.account.currency.ticker}`,
      {
        annotation: {
          type: "TMS",
          description: token.xrayTicket1,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.portfolio.openAddAccountModal();
        await app.addAccount.expectModalVisiblity();

        await app.addAccount.selectToken(token.account);
        await app.addAccount.addAccounts();

        await app.addAccount.done();
        await app.layout.goToPortfolio();
        await app.portfolio.navigateToAsset(token.account.currency.name);
        await app.account.navigateToToken(token.account);
        await app.account.expectLastOperationsVisibility();
        await app.account.expectTokenAccount(token.account);
      },
    );
  });
}

//Warning 🚨: Test may fail due to the GetAppAndVersion issue - Jira: LIVE-12581
for (const token of subAccountReceive) {
  test.describe("Add subAccount when parent exists", () => {
    test.use({
      userdata: "speculos-subAccount",
      speculosApp: token.account.currency.speculosApp,
    });

    test(
      `[${token.account.currency.speculosApp.name}] Add subAccount when parent exists (${token.account.currency.ticker})`,
      {
        annotation: {
          type: "TMS",
          description: token.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(token.account.accountName);
        await app.account.expectAccountVisibility(token.account.accountName);

        await app.account.clickAddToken();
        await app.receive.selectToken(token.account);

        await app.receive.continue();

        const displayedAddress = await app.receive.getAddressDisplayed();
        await app.receive.expectValidReceiveAddress(displayedAddress);

        await app.speculos.expectValidAddressDevice(token.account, displayedAddress);
        await app.receive.expectApproveLabel();
      },
    );
  });
}

for (const token of subAccounts) {
  test.describe("Token visible in parent account", () => {
    test.use({
      userdata: "speculos-subAccount",
    });

    test(
      `Token visible in parent account (${token.account.currency.speculosApp.name}) - ${token.account.currency.ticker}`,
      {
        annotation: {
          type: "TMS",
          description: token.xrayTicket2,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(token.account.accountName);
        await app.account.expectTokenToBePresent(token.account);
      },
    );
  });
}

test.describe.only("Send token (subAccount) - E2E", () => {
  const transaction = new Transaction(
    Account.SOL_GIGA_1,
    Account.SOL_GIGA_2,
    "0.5",
    undefined,
    "noTag",
  );
  test.use({
    userdata: "skip-onboarding",
    speculosApp: transaction.accountToDebit.currency.speculosApp,
    cliCommands: [
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: transaction.accountToCredit.currency.currencyId,
          index: transaction.accountToCredit.index,
          add: true,
          appjson: appjsonPath,
        });
      },
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: transaction.accountToDebit.currency.currencyId,
          index: transaction.accountToDebit.index,
          add: true,
          appjson: appjsonPath,
        });
      },
    ],
  });

  test(
    `Send from ${transaction.accountToDebit.accountName} to ${transaction.accountToCredit.accountName} - ${transaction.accountToDebit.currency.name} - E2E test`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-3055",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(transaction.accountToDebit.accountName);
      await app.account.navigateToTokenInAccount(transaction.accountToDebit);
      await app.account.clickSend();
      await app.send.craftTx(transaction);
      await app.send.continueAmountModal();
      await app.send.expectTxInfoValidity(transaction);
      await app.send.clickContinueToDevice();

      await app.speculos.signSendTransaction(transaction);
      await app.send.expectTxSent();
      await app.account.navigateToViewDetails();
      await app.sendDrawer.addressValueIsVisible(transaction.accountToCredit.address);
      await app.drawer.closeDrawer();
      if (!getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        await app.layout.goToAccounts();
        await app.accounts.clickSyncBtnForAccount(transaction.accountToCredit.accountName);
        await app.accounts.navigateToAccountByName(transaction.accountToCredit.accountName);
        await app.account.selectAndClickOnLastOperation(TransactionStatus.RECEIVED);
        await app.sendDrawer.expectReceiverInfos(transaction);
      }
    },
  );
});

test.describe("Send token (subAccount) - invalid address input", () => {
  const tokenTransactionInvalid = {
    transaction: new Transaction(Account.ALGO_USDT_1, Account.ALGO_USDT_2, "0.1", Fee.MEDIUM),
    expectedErrorMessage: "Recipient account has not opted in the selected ASA.",
  };

  test.use({
    userdata: "skip-onboarding",
    speculosApp: tokenTransactionInvalid.transaction.accountToDebit.currency.speculosApp,
    cliCommands: [
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: tokenTransactionInvalid.transaction.accountToDebit.currency.currencyId,
          index: tokenTransactionInvalid.transaction.accountToDebit.index,
          add: true,
          appjson: appjsonPath,
        });
      },
    ],
  });

  test(
    `Send from ${tokenTransactionInvalid.transaction.accountToDebit.accountName} to ${tokenTransactionInvalid.transaction.accountToCredit.accountName} - invalid address input`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2702",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

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
      await app.send.checkErrorMessage(tokenTransactionInvalid.expectedErrorMessage);
    },
  );
});

const tokenTransactionInvalid = [
  {
    transaction: new Transaction(Account.BSC_BUSD_1, Account.BSC_BUSD_2, "1", Fee.FAST),
    expectedWarningMessage: new RegExp(
      /You need \d+\.\d+ BNB in your account to pay for transaction fees on the Binance Smart Chain network\. .*/,
    ),
    xrayTicket: "B2CQA-2700",
  },
  {
    transaction: new Transaction(Account.ETH_USDT_2, Account.ETH_USDT_1, "1", Fee.FAST),
    expectedWarningMessage: new RegExp(
      /You need \d+\.\d+ ETH in your account to pay for transaction fees on the Ethereum network\. .*/,
    ),
    xrayTicket: "B2CQA-2701",
  },
  {
    transaction: new Transaction(Account.ETH_USDT_1, Account.ETH_USDT_2, "10000", Fee.MEDIUM),
    expectedWarningMessage: "Sorry, insufficient funds",
    xrayTicket: "B2CQA-3043",
  },
];

for (const transaction of tokenTransactionInvalid) {
  test.describe("Send token (subAccount) - invalid amount input", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: transaction.transaction.accountToDebit.currency.speculosApp,
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: transaction.transaction.accountToDebit.currency.currencyId,
            index: transaction.transaction.accountToDebit.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
    });
    test(
      `Send from ${transaction.transaction.accountToDebit.accountName} to ${transaction.transaction.accountToCredit.accountName} - invalid amount input`,
      {
        annotation: {
          type: "TMS",
          description: transaction.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(
          transaction.transaction.accountToDebit.accountName,
        );
        await app.account.navigateToTokenInAccount(transaction.transaction.accountToDebit);
        await app.account.clickSend();
        await app.send.fillRecipient(transaction.transaction.accountToCredit.address);
        await app.send.continue();
        await app.send.fillAmount(transaction.transaction.amount);
        await app.send.checkContinueButtonDisabled();
        if (transaction.expectedWarningMessage instanceof RegExp) {
          await app.send.checkAmountWarningMessage(transaction.expectedWarningMessage);
        } else {
          await app.send.checkErrorMessage(transaction.expectedWarningMessage);
        }
      },
    );
  });
}

test.describe("Send token (subAccount) - valid address & amount input", () => {
  const tokenTransactionValid = new Transaction(
    Account.ETH_USDT_1,
    Account.ETH_USDT_2,
    "1",
    Fee.MEDIUM,
  );
  test.use({
    userdata: "skip-onboarding",
    speculosApp: tokenTransactionValid.accountToDebit.currency.speculosApp,
    cliCommands: [
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: tokenTransactionValid.accountToDebit.currency.currencyId,
          index: tokenTransactionValid.accountToDebit.index,
          add: true,
          appjson: appjsonPath,
        });
      },
    ],
  });

  test(
    `Send from ${tokenTransactionValid.accountToDebit.accountName} to ${tokenTransactionValid.accountToCredit.accountName} - valid address & amount input`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-2703, B2CQA-475",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(tokenTransactionValid.accountToDebit.accountName);
      await app.account.navigateToTokenInAccount(tokenTransactionValid.accountToDebit);
      await app.account.clickSend();
      await app.send.fillRecipient(tokenTransactionValid.accountToCredit.address);
      await app.send.checkContinueButtonEnable();
      await app.send.checkInputErrorVisibility("hidden");
      await app.send.continue();
      await app.send.fillAmount(tokenTransactionValid.amount);
      await app.send.checkContinueButtonEnable();
    },
  );
});
