import test from "tests/fixtures/common";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { setupEnv, performSwapUntilQuoteSelectionStep } from "tests/utils/swapUtils";
import { getEnv } from "@ledgerhq/live-env";
import { overrideNetworkPayload } from "tests/utils/networkUtils";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { liveDataWithAddressCommand } from "tests/utils/cliCommandsUtils";
import { Addresses } from "@ledgerhq/live-common/e2e/enum/Addresses";

const app: AppInfos = AppInfos.EXCHANGE;

const swapEntryPoint = {
  swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.0006"),
};

test.describe("Swap flow from different entry point", () => {
  setupEnv(true);

  const { accountToDebit, accountToCredit } = swapEntryPoint.swap;

  test.use({
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
    "Entry Point - Portfolio page",
    {
      tag: [
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
      ],
      annotation: {
        type: "TMS",
        description: "B2CQA-2985",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToPortfolio();
      await app.swap.goAndWaitForSwapToBeReady(() => app.portfolio.clickSwapButton());
      await app.swap.expectSelectedAssetDisplayed("BTC", electronApp);
    },
  );

  test(
    "Entry Point - Asset Allocation",
    {
      tag: [
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
      ],
      annotation: {
        type: "TMS",
        description: "B2CQA-2986",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToPortfolio();
      await app.portfolio.clickOnSelectedAssetRow(swapEntryPoint.swap.accountToDebit.currency.name);

      await app.swap.goAndWaitForSwapToBeReady(() => app.assetPage.startSwapFlow());
      await app.swap.checkAssetTo(electronApp, swapEntryPoint.swap.accountToDebit.currency.name);
    },
  );

  test(
    "Entry Point - Market page - Click on swap for any coin",
    {
      tag: [
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
      ],
      annotation: {
        type: "TMS",
        description: "B2CQA-2987",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToMarket();

      await app.swap.goAndWaitForSwapToBeReady(() =>
        app.market.startSwapForSelectedTicker(swapEntryPoint.swap.accountToDebit.currency.ticker),
      );
      await app.swap.checkAssetTo(electronApp, swapEntryPoint.swap.accountToDebit.currency.name);
      await app.swap.checkAssetTo(electronApp, swapEntryPoint.swap.accountToDebit.accountName);
    },
  );

  test(
    "Entry Point - Market page - More than one account for an asset",
    {
      tag: [
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
      ],
      annotation: {
        type: "TMS",
        description: "B2CQA-2988",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToMarket();
      await app.market.openCoinPage(swapEntryPoint.swap.accountToDebit.currency.ticker);
      await app.swap.goAndWaitForSwapToBeReady(() => app.market.clickOnSwapButtonOnAsset());
      await app.swap.checkAssetTo(electronApp, swapEntryPoint.swap.accountToDebit.currency.name);
    },
  );

  test(
    "Entry Point - Account page",
    {
      tag: [
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
      ],
      annotation: {
        type: "TMS",
        description: "B2CQA-2989",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(
        getParentAccountName(swapEntryPoint.swap.accountToDebit),
      );
      await app.swap.goAndWaitForSwapToBeReady(() => app.account.navigateToSwap());
      await app.swap.checkAssetTo(electronApp, swapEntryPoint.swap.accountToDebit.currency.name);
      await app.swap.checkAssetTo(electronApp, swapEntryPoint.swap.accountToDebit.accountName);
    },
  );

  test(
    "Entry Point - left menu",
    {
      tag: [
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
      ],
      annotation: {
        type: "TMS",
        description: "B2CQA-2990, B2CQA-523",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());
      await app.swap.expectSelectedAssetDisplayed("BTC", electronApp);
    },
  );
});

const swapMax = [
  {
    fromAccount: Account.ETH_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-3365, B2CQA-3450, B2CQA-3281",
  },
  {
    fromAccount: TokenAccount.ETH_USDT_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-3366, B2CQA-3450, B2CQA-3281",
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
        tag: [
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
        ],
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

        await app.swap.selectFromAccountCoinSelector(electronApp);

        const selector = await getModularSelector(app, "ASSET");
        if (selector) {
          await selector.selectAsset(fromAccount.currency);
          await selector.selectNetwork(fromAccount.currency);
          await selector.selectAccountByName(fromAccount);

          await app.swap.selectToAccountCoinSelector(electronApp);
          await selector.selectAsset(toAccount.currency);
          await selector.selectNetwork(toAccount.currency);
          await selector.selectAccountByName(toAccount);
        } else {
          const networkName = fromAccount.parentAccount?.currency.name;
          await app.swap.selectAsset(fromAccount.currency.name, networkName);
          await app.swapDrawer.selectAccountByName(fromAccount);
          await app.swap.selectAssetTo(electronApp, toAccount.currency.name);
          await app.swapDrawer.selectAccountByName(toAccount);
        }

        await app.swap.clickSwapMax(electronApp);

        const amountToSend = await app.swap.getAmountToSend(electronApp);
        await app.swap.selectExchangeWithoutKyc(electronApp);
        const swap = new Swap(fromAccount, toAccount, amountToSend);

        await app.swap.clickExchangeButton(electronApp);
        await app.speculos.verifyAmountsAndAcceptSwap(swap, amountToSend);
        await app.swapDrawer.verifyExchangeCompletedTextContent(swap.accountToCredit.currency.name);
      },
    );
  });
}

test.describe("Swap history", () => {
  const swapHistory = {
    swap: new Swap(Account.SOL_1, Account.ETH_1, "0.07"),
    xrayTicket: "B2CQA-604",
    provider: Provider.EXODUS,
    swapId: "wQ90NrWdvJz5dA4",
    addressFrom: Addresses.SWAP_HISTORY_SOL_FROM,
    addressTo: Addresses.SWAP_HISTORY_ETH_TO,
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
    userdata: "swap-history",
    speculosApp: app,
  });

  test(
    `User can export all history operations`,
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@solana",
        "@family-solana",
        "@ethereum",
        "@family-evm",
      ],
      annotation: { type: "TMS", description: "B2CQA-604" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      swapHistory.swap.accountToDebit.address = swapHistory.addressFrom;
      swapHistory.swap.accountToCredit.address = swapHistory.addressTo;

      await app.layout.goToSwap();
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
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@solana",
        "@family-solana",
        "@ethereum",
        "@family-evm",
      ],
      annotation: { type: "TMS", description: "B2CQA-602" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.layout.goToSwap();
      await app.swap.goToSwapHistory();
      await app.swap.checkSwapOperation(swapHistory.swapId, swapHistory.provider, swapHistory.swap);
      await app.swap.openSelectedOperation(swapHistory.swapId);
      await app.operationDrawer.expectSwapDrawerInfos(
        swapHistory.swapId,
        swapHistory.swap,
        swapHistory.provider,
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
      tag: [
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
      ],
      annotation: {
        type: "TMS",
        description: "B2CQA-3655",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const sanctionedAddressUrl = getEnv("SANCTIONED_ADDRESSES_URL");
      await overrideNetworkPayload(app, sanctionedAddressUrl, (json: any) => {
        json.bannedAddresses = [fromAccount.address];
        return json;
      });

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);
      await app.swap.selectExchangeWithoutKyc(electronApp);
      await app.swap.clickExchangeButton(electronApp);

      await app.swapDrawer.checkErrorMessage(
        `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${fromAccount.address}`,
      );
    },
  );
});
