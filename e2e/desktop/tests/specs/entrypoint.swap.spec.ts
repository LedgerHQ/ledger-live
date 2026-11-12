import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { setExchangeDependencies } from "@ledgerhq/live-e2e-shared/speculos";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { setupEnv, performSwapUntilQuoteSelectionStep } from "tests/utils/swapUtils";
import { getEnv } from "@shared/env";
import { overrideNetworkPayload } from "tests/utils/networkUtils";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

const app: AppInfos = AppInfos.EXCHANGE;

const swapEntryPoint = {
  swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.0006"),
};

test.describe("Swap - entry points", () => {
  setupEnv(true);

  const { accountToDebit, accountToCredit } = swapEntryPoint.swap;

  test.use({
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: app,

    cliCommandsOnApp: [
      [
        {
          app: accountToDebit.currency.speculosApp,
          cmd: liveDataWithAddressCommand(accountToDebit),
        },
        {
          app: accountToCredit.currency.speculosApp,
          cmd: liveDataWithAddressCommand(accountToCredit),
        },
      ],
      { scope: "test" },
    ],
  });

  test.beforeEach(async () => {
    setExchangeDependencies(
      [accountToDebit, accountToCredit].map(acc => ({
        name: acc.currency.speculosApp.name.replace(/ /g, "_"),
      })),
    );
  });

  test(
    `[${accountToDebit.currency.testLabel}] - Swap entry points and blacklisted address`,
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"],
      annotation: {
        type: "TMS",
        description:
          "B2CQA-2986, B2CQA-2987, B2CQA-2988, B2CQA-2989, B2CQA-2990, B2CQA-523, B2CQA-3655",
      },
    },
    async ({ app }) => {
      const { currency, accountName } = accountToDebit;
      // Registered first: the app caches the sanctioned list on its first fetch.
      await overrideNetworkPayload(
        app,
        getEnv("SANCTIONED_ADDRESSES_URL"),
        (json: Record<string, string[]>) => ({
          ...json,
          bannedAddresses: [accountToCredit.address],
        }),
      );

      await app.swap.goAndWaitForSwapToBeReady(() =>
        app.mainNavigation.openTargetFromMainNavigation("swap"),
      );
      await app.swap.expectSelectedAssetDisplayed(Currency.BTC.ticker);
      await app.swap.clearSwapState();

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.clickAsset(currency);
      await app.assetDetail(currency.id).swapContainer.expectSwapContainerVisible();
      await app.swap.checkAssetToContains(currency.ticker);
      await app.swap.clearSwapState();

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.marketBanner.clickExploreMarketHeader();
      await app.swap.goAndWaitForSwapToBeReady(() =>
        app.market.startSwapForSelectedTicker(currency.ticker),
      );
      await app.swap.checkAssetToContains(currency.ticker);
      await app.swap.checkAssetToAccountNameContains(accountName);
      await app.swap.clearSwapState();

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.marketBanner.clickExploreMarketHeader();
      await app.market.clickCoinRow(currency.ticker);
      await app.assetDetail(currency.id).swapContainer.expectSwapContainerVisible();
      await app.swap.checkAssetToContains(currency.ticker);
      await app.swap.clearSwapState();

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(getParentAccountName(accountToDebit));
      await app.swap.goAndWaitForSwapToBeReady(() => app.account.navigateToSwap());
      await app.swap.checkAssetToContains(currency.ticker);
      await app.swap.checkAssetToAccountNameContains(accountName);
      await app.swap.clearSwapState();

      await app.mainNavigation.openTargetFromMainNavigation("home");
      const minAmount = await app.swap.getMinimumAmount(accountToCredit, accountToDebit);
      const blacklistedSwap = new Swap(accountToCredit, accountToDebit, minAmount);
      await performSwapUntilQuoteSelectionStep({ app, swap: blacklistedSwap, minAmount });
      const provider = await app.swap.selectExchangeWithoutKyc();
      await app.swap.clickExchangeButton(provider.name);
      await app.swapDrawer.checkErrorMessage(
        `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${accountToCredit.address}`,
      );
    },
  );
});

const swapMax = [
  {
    fromAccount: Account.ETH_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-3365, B2CQA-3281",
  },
  {
    fromAccount: TokenAccount.ETH_USDT_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-3366",
  },
];

for (const { fromAccount, toAccount, xrayTicket } of swapMax) {
  test.describe("Swap - send max", () => {
    setupEnv(true);

    const accPair: string[] = [fromAccount, toAccount].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );

    test.beforeEach(async () => {
      setExchangeDependencies(
        accPair.map(appName => ({
          name: appName,
        })),
      );
    });

    test.use({
      teamOwner: Team.SWAP,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: app,

      cliCommandsOnApp: [
        [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(fromAccount),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(toAccount),
          },
        ],
        { scope: "test" },
      ],
    });

    test(
      `[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap max amount`,
      {
        tag: [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"],
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app }) => {
        await app.swap.goAndWaitForSwapToBeReady(() =>
          app.mainNavigation.openTargetFromMainNavigation("swap"),
        );

        await app.swap.selectFromAccountCoinSelector();

        const selector = await getModularSelector(app, "ASSET");
        if (selector) {
          await selector.selectAsset(fromAccount.currency);
          await selector.selectNetwork(fromAccount.currency);
          await selector.selectAccountByName(fromAccount);

          await app.swap.selectToAccountCoinSelector();
          await selector.selectAsset(toAccount.currency);
          await selector.selectNetwork(toAccount.currency);
          await selector.selectAccountByName(toAccount);
        } else {
          const networkName = fromAccount.parentAccount?.currency.name;
          await app.swap.selectAsset(fromAccount.currency.name, networkName);
          await app.swapDrawer.selectAccountByName(fromAccount);
          await app.swap.selectAssetTo(toAccount.currency.name);
          await app.swapDrawer.selectAccountByName(toAccount);
        }

        await app.swap.clickSwapMax();

        const amountToSend = await app.swap.getAmountToSend();
        const provider = await app.swap.selectExchangeWithoutKyc();
        const swap = new Swap(fromAccount, toAccount, amountToSend);

        await app.swap.clickExchangeButton(provider.name);
        await app.speculos.verifyAmountsAndAcceptSwap(swap, amountToSend);
        await app.swapDrawer.verifyExchangeCompletedTextContent(swap.accountToCredit.currency.name);
      },
    );
  });
}

test.describe("Swap - history", () => {
  const swapHistory = {
    swap: new Swap(Account.SOL_1, Account.ETH_1, "0.07"),
    xrayTicket: "B2CQA-602, B2CQA-604",
    provider: SwapProvider.EXODUS,
    swapId: "wQ90NrWdvJz5dA4",
    addressFrom: Addresses.SWAP_HISTORY_SOL_FROM,
    addressTo: Addresses.SWAP_HISTORY_ETH_TO,
    details: {
      date: "December 31, 2025",
      sentAmount: "0.07 SOL",
      receivedAmount: "751.0672 ETH",
      networkFees: "0.000005 SOL",
      receiveAccount: "Ethereum 1",
      providerUrl: "https://www.exodus.com/",
    },
  };

  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [
      swapHistory.swap.accountToDebit,
      swapHistory.swap.accountToCredit,
    ].map(acc => acc.currency.speculosApp.name.replace(/ /g, "_"));
    setExchangeDependencies(accountPair.map(name => ({ name })));
  });

  test.use({
    teamOwner: Team.SWAP,
    userdata: "swap-history",
    speculosApp: app,
  });

  test(
    `[${swapHistory.swap.accountToDebit.currency.testLabel}-${swapHistory.swap.accountToCredit.currency.testLabel}] - Swap history details and export`,
    {
      tag: [...DEVICE_TAGS, "@solana", "@family-solana", "@ethereum", "@family-evm"],
      annotation: { type: "TMS", description: swapHistory.xrayTicket },
    },
    async ({ app }) => {
      swapHistory.swap.accountToDebit.address = swapHistory.addressFrom;
      swapHistory.swap.accountToCredit.address = swapHistory.addressTo;

      await app.swap.goAndWaitForSwapToBeReady(() =>
        app.mainNavigation.openTargetFromMainNavigation("swap"),
      );
      await app.swap.goToSwapHistory();
      await app.swap.checkSwapOperation(swapHistory.swapId, swapHistory.provider, swapHistory.swap);

      await app.swap.clickExportOperations();
      await app.swap.checkExportedFileContents(
        swapHistory.swap,
        swapHistory.provider,
        swapHistory.swapId,
      );

      await app.swap.openSelectedOperation(swapHistory.swapId);
      await app.swapTransactionStatusDialog.expectSwapTransactionStatusDialogInfos(
        swapHistory.swapId.slice(0, 6),
        swapHistory.provider,
        swapHistory.details,
      );
    },
  );
});
