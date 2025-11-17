import { test } from "tests/fixtures/common";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import invariant from "invariant";
import { TransactionStatus } from "@ledgerhq/live-common/e2e/enum/TransactionStatus";

const subAccounts = [
  {
    account: TokenAccount.ETH_USDT_1,
    xrayTicket1: "B2CQA-2577, B2CQA-1079",
    xrayTicket2: "B2CQA-2583",
  },
  { account: Account.XLM_USCD, xrayTicket1: "B2CQA-2579", xrayTicket2: "B2CQA-2585" },
  { account: Account.ALGO_USDT_1, xrayTicket1: "B2CQA-2575", xrayTicket2: "B2CQA-2581" },
  { account: Account.TRX_USDT, xrayTicket1: "B2CQA-2580", xrayTicket2: "B2CQA-2586" },
  { account: Account.BSC_BUSD_1, xrayTicket1: "B2CQA-2576", xrayTicket2: "B2CQA-2582" },
  { account: Account.POL_DAI_1, xrayTicket1: "B2CQA-2578", xrayTicket2: "B2CQA-2584" },
  { account: TokenAccount.SUI_USDC_1, xrayTicket1: "B2CQA-3904", xrayTicket2: "B2CQA-3905" },
];

const subAccountReceive: Array<{
  account: TokenAccount;
  xrayTicket: string;
  shouldSelectTokenOnReceiveFlow?: boolean;
}> = [
  { account: TokenAccount.ETH_USDT_1, xrayTicket: "B2CQA-2492" },
  { account: TokenAccount.ETH_LIDO, xrayTicket: "B2CQA-2491" },
  { account: Account.TRX_USDT, xrayTicket: "B2CQA-2496" },
  { account: Account.BSC_BUSD_1, xrayTicket: "B2CQA-2489" },
  { account: Account.POL_DAI_1, xrayTicket: "B2CQA-2493" },
  { account: Account.POL_UNI, xrayTicket: "B2CQA-2494" },
  { account: TokenAccount.SUI_USDC_1, xrayTicket: "B2CQA-3906" },
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
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
        annotation: {
          type: "TMS",
          description: token.xrayTicket1,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.portfolio.openAddAccountModal();

        const isModularDrawer = await app.modularDrawer.isModularAssetsDrawerVisible();
        if (isModularDrawer) {
          await app.modularDrawer.validateAssetsDrawerItems();
          await app.modularDrawer.selectAssetByTicker(token.account.currency);
          await app.modularDrawer.selectNetwork(token.account.currency);
          await app.scanAccountsDrawer.selectFirstAccount();
          await app.scanAccountsDrawer.clickCloseButton();
        } else {
          await app.addAccount.expectModalVisibility();
          await app.addAccount.selectToken(token.account);
          await app.addAccount.addAccounts();
          await app.addAccount.done();
        }
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
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
        annotation: {
          type: "TMS",
          description: token.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(getParentAccountName(token.account));
        await app.account.expectAccountVisibility(getParentAccountName(token.account));

        await app.account.clickAddToken();
        if (token.shouldSelectTokenOnReceiveFlow) {
          // e.g. for Hedera. This works together with the fact a family activate or not the receiveTokensConfig
          await app.receive.selectToken(token.account);
        }

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
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
        annotation: {
          type: "TMS",
          description: token.xrayTicket2,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(getParentAccountName(token.account));
        await app.account.expectTokenToBePresent(token.account);
      },
    );
  });
}

const transactionE2E = [
  {
    tx: new Transaction(
      TokenAccount.SOL_GIGA_1,
      TokenAccount.SOL_GIGA_2,
      "0.5",
      undefined,
      "noTag",
    ),
    xrayTicket: "B2CQA-3055, B2CQA-3057",
  },
];

for (const transaction of transactionE2E) {
  test.describe("Send token - E2E", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: transaction.tx.accountToDebit.currency.speculosApp,
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: transaction.tx.accountToDebit.currency.speculosApp.name,
            index: transaction.tx.accountToDebit.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
    });

    test(
      `Send from ${transaction.tx.accountToDebit.accountName} to ${transaction.tx.accountToCredit.accountName} - ${transaction.tx.accountToDebit.currency.name} - E2E test`,
      {
        tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex"],
        annotation: {
          type: "TMS",
          description: transaction.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(
          getParentAccountName(transaction.tx.accountToDebit),
        );
        await app.account.navigateToTokenInAccount(transaction.tx.accountToDebit);
        await app.account.clickSend();
        await app.send.craftTx(transaction.tx);
        await app.send.continueAmountModal();
        await app.send.expectTxInfoValidity(transaction.tx);
        await app.send.clickContinueToDevice();

        await app.speculos.signSendTransaction(transaction.tx);
        await app.send.expectTxSent();
        await app.account.navigateToViewDetails();
        await app.sendDrawer.addressValueIsVisible(transaction.tx.accountToCredit.address);
      },
    );
  });
}

const transactionsAddressInvalid = [
  {
    transaction: new Transaction(Account.ALGO_USDT_1, Account.ALGO_USDT_2, "0.1", Fee.MEDIUM),
    recipient: Account.ALGO_USDT_2.address,
    expectedErrorMessage: "Recipient account has not opted in the selected ASA.",
    xrayTicket: "B2CQA-2702",
  },
  {
    transaction: new Transaction(TokenAccount.SOL_GIGA_1, TokenAccount.SOL_WIF_2, "0.1", undefined),
    recipient: TokenAccount.SOL_WIF_2.address,
    expectedErrorMessage: "This associated token account holds another token",
    xrayTicket: "B2CQA-3083",
  },
  {
    transaction: new Transaction(Account.SOL_1, TokenAccount.SOL_GIGA_2, "0.1", undefined),
    recipient: TokenAccount.SOL_GIGA_2.address,
    expectedErrorMessage: "This is a token account. Input a regular wallet address",
    xrayTicket: "B2CQA-3084",
  },
  {
    transaction: new Transaction(TokenAccount.SOL_WIF_1, TokenAccount.SOL_WIF_2, "0.1", undefined),
    recipient: TokenAccount.SOL_WIF_2.currency.contractAddress,
    expectedErrorMessage: "This is a token address. Input a regular wallet address",
    xrayTicket: "B2CQA-3085",
  },
  {
    transaction: new Transaction(TokenAccount.SOL_WIF_1, TokenAccount.SOL_GIGA_2, "0.1", undefined),
    recipient: TokenAccount.SOL_GIGA_2.currency.contractAddress,
    expectedErrorMessage: "This is a token address. Input a regular wallet address",
    xrayTicket: "B2CQA-3086",
  },
  {
    transaction: new Transaction(Account.SOL_1, TokenAccount.SOL_WIF_2, "0.1", undefined),
    recipient: TokenAccount.SOL_WIF_2.currency.contractAddress,
    expectedErrorMessage: "This is a token address. Input a regular wallet address",
    xrayTicket: "B2CQA-3087",
  },
];

for (const transaction of transactionsAddressInvalid) {
  test.describe("Send token - invalid address input", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: transaction.transaction.accountToDebit.currency.speculosApp,
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: transaction.transaction.accountToDebit.currency.speculosApp.name,
            index: transaction.transaction.accountToDebit.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
    });

    test(
      `Send from ${transaction.transaction.accountToDebit.accountName} to ${transaction.transaction.accountToCredit.accountName} - ${transaction.transaction.accountToCredit.currency.name} - ${transaction.expectedErrorMessage}`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
        annotation: {
          type: "TMS",
          description: transaction.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.openSendModalFromSideBar();
        await app.send.selectDebitCurrency(transaction.transaction);
        invariant(transaction.recipient, "Recipient address is not defined");
        await app.send.fillRecipient(transaction.recipient);
        await app.send.checkContinueButtonDisabled();
        await app.send.checkErrorMessage(transaction.expectedErrorMessage);
      },
    );
  });
}

const transactionsAddressValid = [
  {
    transaction: new Transaction(
      TokenAccount.SOL_GIGA_1,
      TokenAccount.SOL_GIGA_2,
      "0.1",
      undefined,
    ),
    expectedErrorMessage:
      "This is not a regular wallet address but an associated token account. Continue only if you know what you are doing",
    xrayTicket: "B2CQA-3082",
  },
];

for (const transaction of transactionsAddressValid) {
  test.describe("Send token - valid address input", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: transaction.transaction.accountToDebit.currency.speculosApp,
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: transaction.transaction.accountToDebit.currency.id,
            index: transaction.transaction.accountToDebit.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
    });

    test(
      `Send from ${transaction.transaction.accountToDebit.accountName} to ${transaction.transaction.accountToCredit.accountName} - ${transaction.transaction.accountToDebit.currency.name} - valid address input`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
        annotation: {
          type: "TMS",
          description: transaction.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.openSendModalFromSideBar();
        await app.send.selectDebitCurrency(transaction.transaction);
        const recipientAddress = transaction.transaction.accountToCredit.address ?? "";
        await app.send.fillRecipient(recipientAddress);

        await app.send.checkContinueButtonEnable();
        await app.send.checkInputWarningMessage(transaction.expectedErrorMessage);
      },
    );
  });
}

const tokenTransactionInvalid = [
  {
    tx: new Transaction(Account.BSC_BUSD_1, Account.BSC_BUSD_2, "1", Fee.FAST),
    expectedWarningMessage: new RegExp(
      /You need \d+\.\d+ BNB in your account to pay for transaction fees on the BNB Chain network\. .*/,
    ),
    xrayTicket: "B2CQA-2700",
  },
  {
    tx: new Transaction(TokenAccount.ETH_USDT_2, TokenAccount.ETH_USDT_1, "1", Fee.FAST),
    expectedWarningMessage: new RegExp(
      /You need \d+\.\d+ ETH in your account to pay for transaction fees on the Ethereum network\. .*/,
    ),
    xrayTicket: "B2CQA-2701",
  },
  {
    tx: new Transaction(TokenAccount.ETH_USDT_1, TokenAccount.ETH_USDT_2, "10000", Fee.MEDIUM),
    expectedWarningMessage: "Sorry, insufficient funds",
    xrayTicket: "B2CQA-3043",
  },
  {
    tx: new Transaction(
      TokenAccount.SOL_GIGA_3,
      TokenAccount.SOL_GIGA_1,
      "0.5",
      undefined,
      "noTag",
    ),
    expectedWarningMessage: new RegExp(
      "You need \\d+\\.\\d+ SOL in your account to pay for transaction fees on the Solana" +
        " network\\. Buy SOL or deposit more into your account\\. Learn more",
    ),
    xrayTicket: "B2CQA-3058",
  },
];

for (const transaction of tokenTransactionInvalid) {
  test.describe("Send token (subAccount) - invalid amount input", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: transaction.tx.accountToDebit.currency.speculosApp,
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: transaction.tx.accountToDebit.currency.speculosApp.name,
            index: transaction.tx.accountToDebit.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
    });
    test(
      `Send from ${transaction.tx.accountToDebit.accountName} ${transaction.tx.accountToDebit.index} to ${transaction.tx.accountToCredit.accountName} - invalid amount input`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
        annotation: {
          type: "TMS",
          description: transaction.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(
          getParentAccountName(transaction.tx.accountToDebit),
        );
        await app.account.navigateToTokenInAccount(transaction.tx.accountToDebit);
        await app.account.clickSend();
        await app.send.craftTx(transaction.tx);
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
    TokenAccount.ETH_USDT_1,
    TokenAccount.ETH_USDT_2,
    "1",
    Fee.MEDIUM,
  );
  test.use({
    userdata: "skip-onboarding",
    speculosApp: tokenTransactionValid.accountToDebit.currency.speculosApp,
    cliCommands: [
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: tokenTransactionValid.accountToDebit.currency.speculosApp.name,
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
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2703, B2CQA-475, B2CQA-3901",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(
        getParentAccountName(tokenTransactionValid.accountToDebit),
      );
      await app.account.navigateToTokenInAccount(tokenTransactionValid.accountToDebit);
      await app.account.clickSend();
      await app.send.fillRecipient(tokenTransactionValid.accountToCredit.address);
      await app.send.checkContinueButtonEnable();
      await app.send.checkInputErrorVisibility("hidden");
      await app.send.continue();
      await app.send.fillAmount(tokenTransactionValid.amount);
      await app.send.checkContinueButtonEnable();

      await app.send.continueAmountModal();
      await app.send.expectTxInfoValidity(tokenTransactionValid);
      await app.send.clickContinueToDevice();

      await app.speculos.signSendTransaction(tokenTransactionValid);
      await app.send.expectTxSent();
      await app.account.navigateToViewDetails();
      await app.sendDrawer.addressValueIsVisible(tokenTransactionValid.accountToCredit.address);
    },
  );
});

test.describe("Send token (subAccount) - e2e ", () => {
  const tokenValidSend = {
    tx: new Transaction(TokenAccount.SUI_USDC_1, TokenAccount.SUI_USDC_2, "0.01", Fee.MEDIUM),
    xrayTicket: "B2CQA-3908",
  };
  test.use({
    userdata: "skip-onboarding",
    speculosApp: tokenValidSend.tx.accountToDebit.currency.speculosApp,
    cliCommands: [
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: tokenValidSend.tx.accountToDebit.currency.speculosApp.name,
          index: tokenValidSend.tx.accountToDebit.index,
          add: true,
          appjson: appjsonPath,
        });
      },
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: tokenValidSend.tx.accountToCredit.currency.speculosApp.name,
          index: tokenValidSend.tx.accountToCredit.index,
          add: true,
          appjson: appjsonPath,
        });
      },
    ],
  });
  test(
    `Send from ${tokenValidSend.tx.accountToDebit.accountName} to ${tokenValidSend.tx.accountToCredit.accountName} - e2e`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
      annotation: { type: "TMS", description: tokenValidSend.xrayTicket },
    },
    async ({ app }) => {
      const tx = tokenValidSend.tx;
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(getParentAccountName(tx.accountToDebit));
      await app.account.navigateToTokenInAccount(tx.accountToDebit);
      await app.account.clickSend();
      await app.send.fillRecipient(tx.accountToCredit.address);
      await app.send.checkContinueButtonEnable();
      await app.send.checkInputErrorVisibility("hidden");
      await app.send.continue();
      await app.send.fillAmount(tx.amount);
      await app.send.continue();
      await app.send.expectTxInfoValidity(tx);
      await app.send.clickContinueToDevice();
      await app.speculos.signSendTransaction(tx);
      await app.send.expectTxSent();
      await app.sendDrawer.expectTransactionTitle(TransactionStatus.SEND);
      await app.sendDrawer.expectTransactionMessageStatus(TransactionStatus.TRANSACTION_SENT);
      await app.account.navigateToViewDetails();
      await app.sendDrawer.addressValueIsVisible(tx.accountToCredit.address);
      await app.sendDrawer.expectReceiverInfos(tx);
      await app.drawer.closeDrawer();
      if (process.env.DISABLE_TRANSACTION_BROADCAST !== "1") {
        await app.layout.goToAccounts();
        await app.accounts.clickSyncBtnForAccount(getParentAccountName(tx.accountToCredit));
        await app.accounts.navigateToAccountByName(getParentAccountName(tx.accountToCredit));
        await app.account.navigateToTokenInAccount(tx.accountToDebit);
        await app.account.expectAccountBalance();
        await app.account.checkAccountChart();
        await app.account.selectAndClickOnLastOperation(TransactionStatus.RECEIVED);
        await app.sendDrawer.expectTransactionStatus(TransactionStatus.CONFIRMED);
        await app.sendDrawer.expectDrawerOperationType(TransactionStatus.RECEIVED);
        await app.sendDrawer.expectDrawerAccounts(tx);
        await app.sendDrawer.expectTokenReceiverInfos(tx);
      }
    },
  );
});
