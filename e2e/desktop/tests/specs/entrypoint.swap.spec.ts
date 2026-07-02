import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-e2e-shared/speculos";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import {
  setupEnv,
  performSwapUntilQuoteSelectionStep,
  expectAmountCloseTo,
  parseBalanceAmount,
} from "tests/utils/swapUtils";
import { expect } from "@playwright/test";
import { getEnv } from "@ledgerhq/live-env";
import { overrideNetworkPayload } from "tests/utils/networkUtils";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { isAggregatedAssetsEnabled } from "tests/utils/featureFlagUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

const app: AppInfos = AppInfos.EXCHANGE;

const swapEntryPoint = {
  swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.0006"),
};

test.describe("Swap flow from different entry point", () => {
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

  test(
    "Entry Point - Asset Allocation",
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2986",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.clickAsset(swapEntryPoint.swap.accountToDebit.currency);
      // aggregatedAssets ON opens swap as the AssetDetail embedded rail; otherwise the legacy
      // asset page's Swap CTA navigates to the full /swap page.
      const swapSurface = (await isAggregatedAssetsEnabled(app.getPage())) ? "embedded" : "full";
      await app.swap.goAndWaitForSwapToBeReady(() => app.assetPage.startSwapFlow(), swapSurface);
      await app.swap.checkAssetToContains(swapEntryPoint.swap.accountToDebit.currency.ticker);
    },
  );

  test(
    "Entry Point - Market page - Click on swap for any coin",
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2987",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.marketBanner.clickExploreMarketHeader();
      await app.swap.goAndWaitForSwapToBeReady(() =>
        app.market.startSwapForSelectedTicker(swapEntryPoint.swap.accountToDebit.currency.ticker),
      );
      await app.swap.checkAssetToContains(swapEntryPoint.swap.accountToDebit.currency.ticker);
      await app.swap.checkAssetToAccountNameContains(
        swapEntryPoint.swap.accountToDebit.accountName,
      );
    },
  );

  test(
    "Entry Point - Market page - More than one account for an asset",
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2988",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.marketBanner.clickExploreMarketHeader();
      await app.market.clickCoinRow(swapEntryPoint.swap.accountToDebit.currency.ticker);
      if (await isAggregatedAssetsEnabled(app.getPage())) {
        await app.assetDetail.expectMarketInfoVisible();
      } else {
        await app.marketCoin.expectMarketCoinPageToBeVisible(
          swapEntryPoint.swap.accountToDebit.currency.id,
        );
        await app.swap.goAndWaitForSwapToBeReady(() => app.marketCoin.clickSwapButton());
      }
      await app.swap.checkAssetToContains(swapEntryPoint.swap.accountToDebit.currency.ticker);
    },
  );

  test(
    "Entry Point - Account page",
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2989",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(
        getParentAccountName(swapEntryPoint.swap.accountToDebit),
      );
      await app.swap.goAndWaitForSwapToBeReady(() => app.account.navigateToSwap());
      await app.swap.checkAssetToContains(swapEntryPoint.swap.accountToDebit.currency.ticker);
      await app.swap.checkAssetToAccountNameContains(
        swapEntryPoint.swap.accountToDebit.accountName,
      );
    },
  );

  test(
    "Entry Point - left menu",
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"],
      annotation: {
        type: "TMS",
        description: "B2CQA-2990, B2CQA-523",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.swap.goAndWaitForSwapToBeReady(() =>
        app.mainNavigation.openTargetFromMainNavigation("swap"),
      );
      await app.swap.expectSelectedAssetDisplayed("BTC");
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
  test.describe("Swap - Send Max", () => {
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
      `Swap max amount from ${fromAccount.currency.name} to ${toAccount.currency.name}`,
      {
        tag: [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"],
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
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

const maxBalanceTags = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@ethereum",
  "@family-evm",
  "@bitcoin",
  "@family-bitcoin",
];

const swapMaxBalancePairs = [
  { fromAccount: Account.ETH_1, toAccount: Account.BTC_NATIVE_SEGWIT_1 },
  { fromAccount: TokenAccount.ETH_USDT_1, toAccount: Account.BTC_NATIVE_SEGWIT_1 },
  { fromAccount: Account.BTC_NATIVE_SEGWIT_1, toAccount: Account.ETH_1 },
];

test.describe("Swap - Max, Balance & Quick Amount Buttons - funded accounts", () => {
  setupEnv(true);

  const uniqueAccounts = [Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, TokenAccount.ETH_USDT_1];
  const uniqueAppNames = Array.from(
    new Set(uniqueAccounts.map(acc => acc.currency.speculosApp.name.replace(/ /g, "_"))),
  );

  test.beforeEach(async () => {
    setExchangeDependencies(uniqueAppNames.map(appName => ({ name: appName })));
  });

  test.use({
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: app,
    cliCommandsOnApp: [
      uniqueAccounts.map(account => ({
        app: account.currency.speculosApp,
        cmd: liveDataWithAddressCommand(account),
      })),
      { scope: "test" },
    ],
  });

  test(
    "Balance is visible and Max/percentage buttons are enabled with correct Max tooltip",
    {
      tag: maxBalanceTags,
      annotation: { type: "TMS", description: "B2CQA-5582" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      for (const { fromAccount, toAccount } of swapMaxBalancePairs) {
        await test.step(`Currency: ${fromAccount.currency.name}`, async () => {
          await performSwapUntilQuoteSelectionStep(app, new Swap(fromAccount, toAccount, ""), "");

          const balanceText = await app.swap.getFromAccountBalanceText();
          expect(balanceText).toBeTruthy();

          expect(await app.swap.isMaxToggleEnabled()).toBe(true);
          expect(await app.swap.isPercentageEnabled("25%")).toBe(true);
          expect(await app.swap.isPercentageEnabled("50%")).toBe(true);
          expect(await app.swap.isPercentageEnabled("75%")).toBe(true);

          await app.swap.checkMaxTooltip("Max amount includes network fees");
        });
      }
    },
  );

  test(
    "Percentage buttons show the correct tooltip text",
    {
      tag: maxBalanceTags,
      annotation: { type: "TMS", description: "B2CQA-5582" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const { fromAccount, toAccount } = swapMaxBalancePairs[0];
      await performSwapUntilQuoteSelectionStep(app, new Swap(fromAccount, toAccount, ""), "");

      for (const percent of ["25%", "50%", "75%"] as const) {
        await app.swap.checkPercentageTooltip(percent, `${percent} of your available balance`);
      }
    },
  );

  test(
    "Percentage buttons fill the correct proportional amount of the balance",
    {
      tag: maxBalanceTags,
      annotation: { type: "TMS", description: "B2CQA-5582" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      for (const { fromAccount, toAccount } of swapMaxBalancePairs) {
        await performSwapUntilQuoteSelectionStep(app, new Swap(fromAccount, toAccount, ""), "");

        const balanceText = await app.swap.getFromAccountBalanceText();
        const balance = parseBalanceAmount(balanceText);

        for (const percent of ["25%", "50%", "75%"] as const) {
          await test.step(`${fromAccount.currency.name} - ${percent}`, async () => {
            await app.swap.clickPercentage(percent);
            const amountToSend = Number(await app.swap.getAmountToSend());
            const expectedAmount = (balance * parseFloat(percent)) / 100;
            expectAmountCloseTo(amountToSend, expectedAmount);
          });
        }
      }
    },
  );
});

test.describe("Swap - Max, Balance & Quick Amount Buttons - insufficient native balance", () => {
  setupEnv(true);

  const fromAccount = Account.ETH_2;
  const toAccount = Account.BTC_NATIVE_SEGWIT_1;

  test.beforeEach(async () => {
    setExchangeDependencies(
      [fromAccount, toAccount].map(acc => ({
        name: acc.currency.speculosApp.name.replace(/ /g, "_"),
      })),
    );
  });

  test.use({
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: app,
    cliCommandsOnApp: [
      [fromAccount, toAccount].map(account => ({
        app: account.currency.speculosApp,
        cmd: liveDataWithAddressCommand(account),
      })),
      { scope: "test" },
    ],
  });

  test(
    "Max is disabled with correct tooltip while percentage buttons stay enabled",
    {
      tag: maxBalanceTags,
      annotation: { type: "TMS", description: "B2CQA-5582" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await performSwapUntilQuoteSelectionStep(app, new Swap(fromAccount, toAccount, ""), "");

      expect(await app.swap.isMaxToggleEnabled()).toBe(false);
      await app.swap.checkMaxTooltip("You don't have enough balance including network fees");

      expect(await app.swap.isPercentageEnabled("25%")).toBe(true);
      expect(await app.swap.isPercentageEnabled("50%")).toBe(true);
      expect(await app.swap.isPercentageEnabled("75%")).toBe(true);
    },
  );
});

test.describe("Swap - Max, Balance & Quick Amount Buttons - zero balance", () => {
  setupEnv(true);

  const fromAccount = TokenAccount.ETH_USDC_2;
  const toAccount = Account.BTC_NATIVE_SEGWIT_1;

  test.beforeEach(async () => {
    setExchangeDependencies(
      [fromAccount, toAccount].map(acc => ({
        name: acc.currency.speculosApp.name.replace(/ /g, "_"),
      })),
    );
  });

  test.use({
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: app,
    cliCommandsOnApp: [
      [fromAccount, toAccount].map(account => ({
        app: account.currency.speculosApp,
        cmd: liveDataWithAddressCommand(account),
      })),
      { scope: "test" },
    ],
  });

  test(
    "Max and percentage buttons are disabled for a zero-balance token account",
    {
      tag: maxBalanceTags,
      annotation: { type: "TMS", description: "B2CQA-5582" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await performSwapUntilQuoteSelectionStep(app, new Swap(fromAccount, toAccount, ""), "");

      expect(await app.swap.isMaxToggleEnabled()).toBe(false);
      await app.swap.checkMaxTooltip("You don't have enough balance including network fees");

      expect(await app.swap.isPercentageEnabled("25%")).toBe(false);
      expect(await app.swap.isPercentageEnabled("50%")).toBe(false);
      expect(await app.swap.isPercentageEnabled("75%")).toBe(false);
    },
  );
});

test.describe("Swap history", () => {
  const swapHistory = {
    swap: new Swap(Account.SOL_1, Account.ETH_1, "0.07"),
    xrayTicket: "B2CQA-604",
    provider: SwapProvider.EXODUS,
    swapId: "wQ90NrWdvJz5dA4",
    addressFrom: Addresses.SWAP_HISTORY_SOL_FROM,
    addressTo: Addresses.SWAP_HISTORY_ETH_TO,
    details: {
      date: "July 15, 2025",
      sentAmount: "0.07 SOL",
      receivedAmount: "751.0672 ETH",
      networkFees: "0.000005 SOL",
      receiveAccount: "Ethereum 1",
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
    `User can export all history operations`,
    {
      tag: [...DEVICE_TAGS, "@solana", "@family-solana", "@ethereum", "@family-evm"],
      annotation: { type: "TMS", description: "B2CQA-604" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      swapHistory.swap.accountToDebit.address = swapHistory.addressFrom;
      swapHistory.swap.accountToCredit.address = swapHistory.addressTo;

      await app.swap.goAndWaitForSwapToBeReady(() =>
        app.mainNavigation.openTargetFromMainNavigation("swap"),
      );
      await app.swap.goToSwapHistory();

      await app.swap.clickExportOperations();
      await app.swap.checkExportedFileContents(
        swapHistory.swap,
        swapHistory.provider,
        swapHistory.swapId,
      );
    },
  );

  test(
    `User should be able to see their swap history from the swap history page`,
    {
      tag: [...DEVICE_TAGS, "@solana", "@family-solana", "@ethereum", "@family-evm"],
      annotation: { type: "TMS", description: "B2CQA-602" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("swap");
      await app.swap.goToSwapHistory();
      await app.swap.checkSwapOperation(swapHistory.swapId, swapHistory.provider, swapHistory.swap);
      await app.swap.openSelectedOperation(swapHistory.swapId);
      await app.swapTransactionStatusDialog.expectSwapTransactionStatusDialogInfos(
        swapHistory.swapId.slice(0, 6),
        swapHistory.provider,
        swapHistory.details,
      );
    },
  );
});

test.describe("Swap - Block blacklisted addresses", () => {
  const fromAccount = Account.ETH_1;
  const toAccount = Account.BTC_NATIVE_SEGWIT_1;
  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [fromAccount, toAccount].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );
    setExchangeDependencies(accountPair.map(name => ({ name })));
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
    `Swap ${fromAccount.currency.name} to ${toAccount.currency.name}`,
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"],
      annotation: {
        type: "TMS",
        description: "B2CQA-3655",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const sanctionedAddressUrl = getEnv("SANCTIONED_ADDRESSES_URL");
      await overrideNetworkPayload(app, sanctionedAddressUrl, (json: any) => {
        json.bannedAddresses = [fromAccount.address];
        return json;
      });

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, swap, minAmount);
      const provider = await app.swap.selectExchangeWithoutKyc();
      await app.swap.clickExchangeButton(provider.name);

      await app.swapDrawer.checkErrorMessage(
        `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${fromAccount.address}`,
      );
    },
  );
});
