import test from "../fixtures/common";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { addTmsLink } from "../utils/allureUtils";
import { getDescription } from "../utils/customJsonReporter";
import { CLI } from "../utils/cliUtils";
import {
  setupEnv,
  performSwapUntilQuoteSelectionStep,
  performSwapUntilDeviceVerificationStep,
} from "../utils/swapUtils";

const app: AppInfos = AppInfos.EXCHANGE;

const liveDataCommand = (currencyApp: { name: string }, index: number) => (userdataPath?: string) =>
  CLI.liveData({
    currency: currencyApp.name,
    index,
    add: true,
    appjson: userdataPath,
  });

const swaps = [
  {
    fromAccount: Account.ETH_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-2750, B2CQA-3135, B2CQA-620",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.BTC_NATIVE_SEGWIT_1,
    toAccount: Account.ETH_1,
    xrayTicket: "B2CQA-2744, B2CQA-2432",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: TokenAccount.ETH_USDT_1,
    toAccount: TokenAccount.ETH_1,
    xrayTicket: "B2CQA-2752, B2CQA-2048",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.ETH_1,
    toAccount: Account.SOL_1,
    xrayTicket: "B2CQA-2748",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.ETH_1,
    toAccount: TokenAccount.ETH_USDT_1,
    xrayTicket: "B2CQA-2749",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.BTC_NATIVE_SEGWIT_1,
    toAccount: Account.SOL_1,
    xrayTicket: "B2CQA-2747",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.BTC_NATIVE_SEGWIT_1,
    toAccount: TokenAccount.ETH_USDT_1,
    xrayTicket: "B2CQA-2746",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: TokenAccount.ETH_USDT_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-2753",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: TokenAccount.ETH_USDT_1,
    toAccount: Account.SOL_1,
    xrayTicket: "B2CQA-2751",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.SOL_1,
    toAccount: Account.ETH_1,
    xrayTicket: "B2CQA-2775",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.SOL_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-2776",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.SOL_1,
    toAccount: TokenAccount.ETH_USDT_1,
    xrayTicket: "B2CQA-2777",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: TokenAccount.ETH_USDC_1,
    toAccount: Account.ETH_1,
    xrayTicket: "B2CQA-2830",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: TokenAccount.ETH_USDC_1,
    toAccount: Account.SOL_1,
    xrayTicket: "B2CQA-2831",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: TokenAccount.ETH_USDC_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-2832",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.ETH_1,
    toAccount: Account.DOT_1,
    xrayTicket: "B2CQA-3017",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.XRP_1,
    toAccount: TokenAccount.ETH_USDC_1,
    xrayTicket: "B2CQA-3075",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.ETH_1,
    toAccount: Account.XRP_1,
    xrayTicket: "B2CQA-3076",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.XRP_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-3077",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.BTC_NATIVE_SEGWIT_1,
    toAccount: Account.LTC_1,
    xrayTicket: "B2CQA-3078",
    tag: ["@NanoSP", "@LNS", "@NanoX"],
  },
  {
    fromAccount: Account.APTOS_1,
    toAccount: Account.SOL_1,
    xrayTicket: "B2CQA-3081",
    tag: ["@NanoSP", "@NanoX"],
  },
];

for (const { fromAccount, toAccount, xrayTicket, tag } of swaps) {
  test.describe("Swap - Accepted (without tx broadcast)", () => {
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
      userdata: "skip-onboarding",
      speculosApp: app,

      cliCommandsOnApp: [
        [
          {
            app: fromAccount.currency.speculosApp,
            cmd: liveDataCommand(fromAccount.currency.speculosApp, fromAccount.index),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataCommand(toAccount.currency.speculosApp, toAccount.index),
          },
        ],
        { scope: "test" },
      ],
    });

    test(
      `Swap ${fromAccount.currency.name} to ${toAccount.currency.name}`,
      {
        tag: tag,
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
        const swap = new Swap(fromAccount, toAccount, minAmount);

        await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);
        const selectedProvider = await app.swap.selectExchangeWithoutKyc(electronApp);

        await performSwapUntilDeviceVerificationStep(
          app,
          electronApp,
          swap,
          selectedProvider,
          minAmount,
        );
        await app.speculos.verifyAmountsAndAcceptSwap(swap, minAmount);
        await app.swapDrawer.verifyExchangeCompletedTextContent(swap.accountToCredit.currency.name);
      },
    );
  });
}
