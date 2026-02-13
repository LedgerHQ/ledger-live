import test from "tests/fixtures/common";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { setupEnv, performSwapUntilQuoteSelectionStep } from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "tests/utils/cliCommandsUtils";

const app: AppInfos = AppInfos.EXCHANGE;

const swaps = [
  {
    fromAccount: Account.ETH_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-2750, B2CQA-3135, B2CQA-620, B2CQA-3450",
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
  },
  {
    fromAccount: Account.BTC_NATIVE_SEGWIT_1,
    toAccount: Account.ETH_1,
    xrayTicket: "B2CQA-2744, B2CQA-2432, B2CQA-3450",
    tag: [
      "@NanoSP",
      "@LNS",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@smoke",
      "@swapSmoke",
      "@ethereum",
      "@family-evm",
      "@bitcoin",
      "@family-bitcoin",
    ],
  },
  {
    fromAccount: Account.ETH_1,
    toAccount: TokenAccount.ETH_USDT_1,
    xrayTicket: "B2CQA-2749, B2CQA-3450",
    tag: [
      "@NanoSP",
      "@LNS",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@swapSmoke",
      "@ethereum",
      "@family-evm",
    ],
  },
  {
    fromAccount: Account.BTC_NATIVE_SEGWIT_1,
    toAccount: TokenAccount.ETH_USDT_1,
    xrayTicket: "B2CQA-2746, B2CQA-3450",
    tag: [
      "@NanoSP",
      "@LNS",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@bitcoin",
      "@family-bitcoin",
      "@ethereum",
      "@family-evm",
    ],
  },
  {
    fromAccount: TokenAccount.ETH_USDT_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-2753, B2CQA-3450",
    tag: [
      "@NanoSP",
      "@LNS",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@swapSmoke",
      "@ethereum",
      "@family-evm",
      "@bitcoin",
      "@family-bitcoin",
    ],
  },
  {
    fromAccount: Account.SOL_1,
    toAccount: Account.ETH_1,
    xrayTicket: "B2CQA-2775, B2CQA-3450",
    tag: [
      "@NanoSP",
      "@LNS",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@solana",
      "@family-solana",
      "@family-evm",
      "@ethereum",
    ],
  },
  {
    fromAccount: Account.SOL_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-2776, B2CQA-3450",
    tag: [
      "@NanoSP",
      "@LNS",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@swapSmoke",
      "@solana",
      "@family-solana",
      "@bitcoin",
      "@family-bitcoin",
    ],
  },
  {
    fromAccount: TokenAccount.ETH_USDC_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-2832, B2CQA-3450, B2CQA-3281",
    tag: [
      "@NanoSP",
      "@LNS",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@ethereum",
      "@family-evm",
      "@family-bitcoin",
      "@bitcoin",
    ],
  },
  {
    fromAccount: Account.XRP_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-3077, B2CQA-3450, B2CQA-3281",
    tag: [
      "@NanoSP",
      "@LNS",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@xrp",
      "@family-xrp",
      "@bitcoin",
      "@family-bitcoin",
    ],
  },
  //ToDo: enable once it's back in prod
  // {
  //   fromAccount: Account.APTOS_1,
  //   toAccount: Account.SOL_1,
  //   xrayTicket: "B2CQA-3081, B2CQA-3450, B2CQA-3281",
  //   tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@aptos", "@solana", "@family-solana","@family-aptos"],
  // },
  //ToDo: enable once Hedera Swap E2E test issue fixed
  // Task https://ledgerhq.atlassian.net/browse/LIVE-21744
  {
    fromAccount: Account.HEDERA_1,
    toAccount: Account.XRP_1,
    xrayTicket: "B2CQA-3753",
    tag: [
      "@NanoSP",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@hedera",
      "@xrp",
      "@family-xrp",
      "@family-hedera",
    ],
  },
  {
    fromAccount: TokenAccount.SUI_USDC_1,
    toAccount: Account.SOL_1,
    xrayTicket: "B2CQA-3907",
    tag: [
      "@NanoSP",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@sui",
      "@solana",
      "@family-solana",
      "@family-sui",
    ],
  },
  {
    fromAccount: TokenAccount.CELO_1,
    toAccount: Account.SOL_1,
    xrayTicket: "B2CQA-4011",
    tag: [
      "@NanoSP",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@celo",
      "@solana",
      "@family-solana",
      "@family-celo",
    ],
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
            cmd: liveDataWithAddressCommand(fromAccount),
          },
          {
            app: toAccount.currency.speculosApp,
            cmd: liveDataWithAddressCommand(toAccount),
          },
        ],
        { scope: "test" },
      ],
      env: {
        LEDGER_COUNTERVALUES_API: "https://countervalues-service.api.ledger-test.com",
      },
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
        await app.swap.selectExchangeWithoutKyc(electronApp);

        await app.swap.clickExchangeButton(electronApp);
        await app.speculos.verifyAmountsAndAcceptSwap(swap, minAmount);
        await app.swapDrawer.verifyExchangeCompletedTextContent(swap.accountToCredit.currency.name);
      },
    );
  });
}
