import { test } from "tests/fixtures/common";
import { SendScenario, TestFolder, sendFolder } from "@ledgerhq/live-e2e-shared/enum/TestFolder";
import { coinTeamOwner } from "@ledgerhq/live-e2e-shared/data/coinTeamOwner";
import { ownedBy } from "tests/utils/allureUtils";
import {
  Account,
  TokenAccount,
  getParentAccountName,
  type AccountType,
} from "@ledgerhq/live-e2e-shared/enum/Account";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { liveDataCommand, getAccountAddress } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import {
  FF_NEW_SEND_FLOW_ENABLED,
  FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";

const subAccounts: Array<{
  account: TokenAccount;
  xrayTicket1: string;
  xrayTicket2?: string;
  notPreSeeded?: boolean;
}> = [
  {
    account: TokenAccount.ETH_USDT_1,
    xrayTicket1: "B2CQA-2577",
    xrayTicket2: "B2CQA-2583",
  },
  {
    account: TokenAccount.XLM_USDC,
    xrayTicket1: "B2CQA-2579",
  },
  {
    account: TokenAccount.ALGO_USDT_1,
    xrayTicket1: "B2CQA-2575",
    xrayTicket2: "B2CQA-2581",
  },
  {
    account: TokenAccount.TRX_USDT,
    xrayTicket1: "B2CQA-2580",
    xrayTicket2: "B2CQA-2586",
  },
  {
    account: TokenAccount.SUI_USDC_1,
    xrayTicket1: "B2CQA-3904",
    xrayTicket2: "B2CQA-3905",
  },
  {
    account: TokenAccount.SOL_GIGA_1,
    xrayTicket1: "B2CQA-6119",
    xrayTicket2: "B2CQA-6128",
    notPreSeeded: true,
  },
];

const subAccountReceive: Array<{
  account: TokenAccount;
  xrayTicket: string;
  shouldSelectTokenOnReceiveFlow?: boolean;
  shouldSelectReceiveCryptoOption?: boolean;
}> = [
  {
    account: TokenAccount.ETH_USDT_1,
    xrayTicket: "B2CQA-2492",
    shouldSelectReceiveCryptoOption: true,
  },
  { account: TokenAccount.TRX_USDT, xrayTicket: "B2CQA-2496" },
  { account: TokenAccount.SUI_USDC_1, xrayTicket: "B2CQA-3906" },
];

const shouldSkipLNS = (account: TokenAccount): boolean => {
  const parentCurrencyId = account.parentAccount?.currency.id;
  return parentCurrencyId === Currency.SUI.id || parentCurrencyId === Currency.SOL.id;
};

for (const token of subAccounts) {
  const owner = ownedBy(coinTeamOwner(token.account.currency.id), {
    folder: TestFolder.SUBACCOUNTS,
  });
  test.describe("Add sub-account", owner, () => {
    test.use({
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: token.account.parentAccount?.currency.speculosApp,
    });

    test(
      `[${token.account.currency.testLabel}] - Add sub-account - without parent`,
      {
        tag: buildTags({
          currencyId: token.account.currency.id,
          skipLNS: shouldSkipLNS(token.account),
          extraTags: token.account === TokenAccount.ETH_USDT_1 ? ["@smoke"] : [],
        }),
        annotation: {
          type: "TMS",
          description: token.xrayTicket1,
        },
      },
      async ({ app }) => {
        await app.portfolio.clickAddAccountButton();

        const selector = await getModularSelector(app, "ASSET");
        if (selector) {
          await selector.validateItems();
          await selector.selectAssetByTicker(token.account.currency);
          await selector.selectNetwork(token.account.currency);
          await app.scanAccountsDrawer.selectFirstAccount();
          await app.scanAccountsDrawer.clickCloseButton();
        } else {
          await app.addAccount.expectModalVisibility();
          await app.addAccount.selectToken(token.account);
          await app.addAccount.addAccounts();
          await app.addAccount.done();
        }

        const parentAccountName = getParentAccountName(token.account);
        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(parentAccountName);
        await app.account.expectAccountVisibility(parentAccountName);
        await app.account.navigateToTokenInAccount(token.account);
        await app.account.expectTokenAccount(token.account);
        await app.account.expectLastOperationsVisibility();
      },
    );
  });
}

for (const token of subAccountReceive) {
  const owner = ownedBy(coinTeamOwner(token.account.currency.id), {
    folder: TestFolder.SUBACCOUNTS,
  });
  test.describe("Add sub-account", owner, () => {
    test.use({
      userdata: "speculos-subAccount",
      speculosApp: token.account.currency.speculosApp,
    });

    test(
      `[${token.account.currency.testLabel}] - Add sub-account - with parent`,
      {
        tag: buildTags({
          currencyId: token.account.currency.id,
          skipLNS: shouldSkipLNS(token.account),
        }),
        annotation: {
          type: "TMS",
          description: token.xrayTicket,
        },
      },
      async ({ app }) => {
        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(getParentAccountName(token.account));
        await app.account.expectAccountVisibility(getParentAccountName(token.account));

        await app.account.clickAddToken(
          token.account.parentAccount?.currency ?? token.account.currency,
        );
        if (token.shouldSelectReceiveCryptoOption) {
          await app.receive.expectReceiveMenu();
          await app.receive.clickReceive();
        }
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

const tokenVisibleSubAccounts = subAccounts.flatMap(({ account, xrayTicket2, notPreSeeded }) =>
  xrayTicket2 && !notPreSeeded ? [{ account, xrayTicket: xrayTicket2 }] : [],
);

for (const token of tokenVisibleSubAccounts) {
  const owner = ownedBy(coinTeamOwner(token.account.currency.id), {
    folder: TestFolder.SUBACCOUNTS,
  });
  test.describe("Add sub-account", owner, () => {
    test.use({
      userdata: "speculos-subAccount",
    });

    test(
      `[${token.account.currency.testLabel}] - Token visible in parent account`,
      {
        tag: buildTags({
          currencyId: token.account.currency.id,
          skipLNS: shouldSkipLNS(token.account),
          extraTags: token.account === TokenAccount.ETH_USDT_1 ? ["@smoke"] : [],
        }),
        annotation: {
          type: "TMS",
          description: token.xrayTicket,
        },
      },
      async ({ app }) => {
        const parentAccountName = getParentAccountName(token.account);
        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(parentAccountName);
        await app.account.expectAccountVisibility(parentAccountName);
        await app.account.expectTokenToBePresent(token.account);
      },
    );
  });
}

type InvalidRecipient = {
  accountToCredit: AccountType;
  recipient?: string;
  expectedErrorMessage: string;
};

const transactionsAddressInvalid: Array<{
  accountToDebit: AccountType;
  recipients: InvalidRecipient[];
  scenario: string;
  xrayTicket: string;
}> = [
  {
    accountToDebit: TokenAccount.ALGO_USDT_1,
    recipients: [
      {
        accountToCredit: Account.ALGO_3,
        recipient: undefined,
        expectedErrorMessage: "Recipient account has not opted in the selected ASA.",
      },
    ],
    scenario: "recipient not opted in",
    xrayTicket: "B2CQA-2702",
  },
  {
    accountToDebit: TokenAccount.SOL_GIGA_1,
    recipients: [
      {
        accountToCredit: TokenAccount.SOL_WIF_2,
        recipient: Addresses.SOL_WIF_2_ATA_ADDRESS, //CLI doesn't allow us to get ATA address
        expectedErrorMessage: "This associated token account holds another token",
      },
    ],
    scenario: "recipient holds another token",
    xrayTicket: "B2CQA-3083",
  },
  {
    accountToDebit: Account.SOL_1,
    recipients: [
      {
        accountToCredit: TokenAccount.SOL_GIGA_2,
        recipient: Addresses.SOL_GIGA_2_ATA_ADDRESS, //CLI doesn't allow us to get ATA address
        expectedErrorMessage: "This is a token account. Input a regular wallet address",
      },
      {
        accountToCredit: TokenAccount.SOL_WIF_2,
        recipient: TokenAccount.SOL_WIF_2.currency.contractAddress,
        expectedErrorMessage: "This is a token address. Input a regular wallet address",
      },
    ],
    scenario: "token account and token address",
    xrayTicket: "B2CQA-3084, B2CQA-3087",
  },
  {
    accountToDebit: TokenAccount.SOL_WIF_1,
    recipients: [
      {
        accountToCredit: TokenAccount.SOL_WIF_2,
        recipient: TokenAccount.SOL_WIF_2.currency.contractAddress,
        expectedErrorMessage: "This is a token address. Input a regular wallet address",
      },
      {
        accountToCredit: TokenAccount.SOL_GIGA_2,
        recipient: TokenAccount.SOL_GIGA_2.currency.contractAddress,
        expectedErrorMessage: "This is a token address. Input a regular wallet address",
      },
    ],
    scenario: "token address",
    xrayTicket: "B2CQA-3085, B2CQA-3086",
  },
];

for (const transaction of transactionsAddressInvalid) {
  const { accountToDebit, recipients } = transaction;
  const creditLabels = recipients
    .map(({ accountToCredit }) => accountToCredit.currency.testLabel)
    .join("/");
  const owner = ownedBy(coinTeamOwner(accountToDebit.currency.id), {
    folder: sendFolder(accountToDebit),
    scenario: SendScenario.INVALID_ADDRESS,
  });
  test.describe("Send - new flow - token invalid address", owner, () => {
    test.use({
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: accountToDebit.currency.speculosApp,
      cliCommands: [
        async (userdataPath?: string) => {
          await liveDataCommand(accountToDebit, { useScheme: false })(userdataPath);
          await Promise.all(
            recipients
              .filter(invalidRecipient => invalidRecipient.recipient === undefined)
              .map(async invalidRecipient => {
                invalidRecipient.recipient = await getAccountAddress(
                  invalidRecipient.accountToCredit,
                );
              }),
          );
          return recipients.map(({ recipient }) => recipient);
        },
      ],
      featureFlags: {
        ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
        ...FF_NEW_SEND_FLOW_ENABLED,
      },
    });

    test(
      `[${accountToDebit.currency.testLabel}-${creditLabels}] - Send - invalid address - ${transaction.scenario}`,
      {
        tag: buildTags({ currencyId: accountToDebit.currency.id }),
        annotation: {
          type: "TMS",
          description: transaction.xrayTicket,
        },
      },
      async ({ app }) => {
        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(getParentAccountName(accountToDebit));
        if (accountToDebit instanceof TokenAccount) {
          await app.account.navigateToTokenInAccount(accountToDebit);
        }
        await app.account.clickSend(accountToDebit.currency);
        await app.newSendFlow.waitForDialog();
        for (const { recipient, expectedErrorMessage } of recipients) {
          await app.newSendFlow.clearRecipient();
          await app.newSendFlow.expectRecipientErrorHidden();
          await app.newSendFlow.typeAddress(recipient ?? "");
          await app.newSendFlow.expectRecipientError(expectedErrorMessage);
        }
      },
    );
  });
}
