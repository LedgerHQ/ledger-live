import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import {
  setupEnv,
  performSwapUntilQuoteSelectionStep,
  ensureTokenApproval,
} from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";

const exchangeApp: AppInfos = AppInfos.EXCHANGE;

const swaps = [
  {
    fromAccount: Account.ETH_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-2750, B2CQA-3135, B2CQA-620",
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
    xrayTicket: "B2CQA-2749",
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
    fromAccount: TokenAccount.ETH_USDT_1,
    toAccount: Account.ETH_1,
    xrayTicket: "B2CQA-2752, B2CQA-2048",
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
    xrayTicket: "B2CQA-2746",
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
    xrayTicket: "B2CQA-2753",
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
    fromAccount: TokenAccount.ETH_USDT_1,
    toAccount: Account.SOL_1,
    xrayTicket: "B2CQA-2751",
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
      "@solana",
      "@family-solana",
    ],
  },
  {
    fromAccount: Account.ETH_1,
    toAccount: Account.SOL_1,
    xrayTicket: "B2CQA-2748",
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
      "@family-evm",
      "@ethereum",
    ],
  },
  {
    fromAccount: Account.SOL_1,
    toAccount: Account.ETH_1,
    xrayTicket: "B2CQA-2775",
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
    fromAccount: Account.ETH_1,
    toAccount: Account.DOT_1,
    xrayTicket: "B2CQA-3017",
    tag: [
      "@NanoSP",
      "@LNS",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@swapSmoke",
      "@family-evm",
      "@ethereum",
      "@polkadot",
      "@family-polkadot",
    ],
  },
  {
    fromAccount: Account.BTC_NATIVE_SEGWIT_1,
    toAccount: Account.SOL_1,
    xrayTicket: "B2CQA-2747",
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
    fromAccount: Account.SOL_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-2776",
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
    fromAccount: Account.BTC_NATIVE_SEGWIT_1,
    toAccount: Account.LTC_1,
    xrayTicket: "B2CQA-3078",
    tag: [
      "@NanoSP",
      "@LNS",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@swapSmoke",
      "@bitcoin",
      "@family-bitcoin",
      "@litecoin",
      "@family-litecoin",
    ],
  },
  {
    fromAccount: TokenAccount.ETH_USDC_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-2832, B2CQA-3281",
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
    fromAccount: TokenAccount.ETH_USDC_1,
    toAccount: Account.ETH_1,
    xrayTicket: "B2CQA-2830, B2CQA-3281",
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
    fromAccount: Account.XRP_1,
    toAccount: TokenAccount.ETH_USDC_1,
    xrayTicket: "B2CQA-3075, B2CQA-3281",
    tag: [
      "@NanoSP",
      "@LNS",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@xrp",
      "@family-xrp",
      "@ethereum",
      "@family-evm",
    ],
  },
  {
    fromAccount: Account.XRP_1,
    toAccount: Account.BTC_NATIVE_SEGWIT_1,
    xrayTicket: "B2CQA-3077, B2CQA-3281",
    tag: [
      "@NanoSP",
      "@LNS",
      "@NanoX",
      "@Stax",
      "@Flex",
      "@NanoGen5",
      "@ripple",
      "@family-xrp",
      "@bitcoin",
      "@family-bitcoin",
    ],
  },
  //ToDo: enable once it's back in prod
  // {
  //   fromAccount: Account.APTOS_1,
  //   toAccount: Account.SOL_1,
  //   xrayTicket: "B2CQA-3081, B2CQA-3281",
  //   tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@aptos", "@solana", "@family-solana","@family-aptos"],
  // },
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
      "@ripple",
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
      teamOwner: Team.SWAP,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: exchangeApp,

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
        tag: tag,
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, speculos }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
        const swap = new Swap(fromAccount, toAccount, minAmount);

        await performSwapUntilQuoteSelectionStep(app, swap, minAmount);
        const provider = await app.swap.selectExchangeWithoutKyc(swap);
        swap.setProvider(provider);
        await ensureTokenApproval(fromAccount, provider, minAmount);

        if (provider.app) {
          if (provider.app !== exchangeApp) {
            await speculos.relaunch(provider.app.name);
          }
          await app.swap.clickExchangeButton(provider.name);
          await app.swap.clickExecuteSwapButton();
          await app.swap.clickContinueButton();
          await app.speculos.verifyAmountsAndAcceptSwap(swap, minAmount);
          await app.swap.expectTransactionSentToasterToBeVisible();
        } else {
          await app.swap.clickExchangeButton(provider.name);
          await app.speculos.verifyAmountsAndAcceptSwap(swap, minAmount);
          await app.swapDrawer.verifyExchangeCompletedTextContent(
            swap.accountToCredit.currency.name,
          );
        }
      },
    );
  });
}
