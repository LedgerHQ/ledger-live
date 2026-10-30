import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-e2e-shared/speculos";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { setupEnv, performSwapUntilQuoteSelectionStep } from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";
import {
  BTC_ACCOUNT_ID,
  ETH_ACCOUNT_ID,
  USDT_ACCOUNT_ID,
} from "@ledgerhq/live-e2e-shared/swapDeeplinkFixtures";
import { Application } from "tests/page";

// Selects "from"/"to" via a ledgerwallet://swap deeplink instead of the modular
// asset dialog: the dialog's virtualized list can bind a click to a stale row's
// data mid-render, so looping through repeated searches here flaked intermittently.
async function openSwapPairViaDeeplink(
  app: Application,
  fromAccountId: string,
  toAccountId: string,
) {
  await app.swap.clearSwapState();
  await app.swap.openViaDeeplink(
    `ledgerwallet://swap?fromAccountId=${fromAccountId}&toAccountId=${toAccountId}`,
  );
}

const app: AppInfos = AppInfos.EXCHANGE;

const maxBalanceTags = [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"];

const percentages = ["25%", "50%", "75%"] as const;

const swapMaxBalancePairs = [
  {
    fromAccount: Account.ETH_3,
    fromAccountId: ETH_ACCOUNT_ID,
    toAccount: Account.BTC_NATIVE_SEGWIT_2,
    toAccountId: BTC_ACCOUNT_ID,
  },
  {
    fromAccount: TokenAccount.ETH_USDT_1,
    fromAccountId: USDT_ACCOUNT_ID,
    toAccount: Account.BTC_NATIVE_SEGWIT_2,
    toAccountId: BTC_ACCOUNT_ID,
  },
  {
    fromAccount: Account.BTC_NATIVE_SEGWIT_2,
    fromAccountId: BTC_ACCOUNT_ID,
    toAccount: Account.ETH_3,
    toAccountId: ETH_ACCOUNT_ID,
  },
];

const insufficientBalanceSwaps = [
  {
    swap: new Swap(Account.ETH_2, Account.BTC_NATIVE_SEGWIT_1, ""),
    percentageButtonsEnabled: true,
  },
  {
    swap: new Swap(TokenAccount.ETH_USDC_2, Account.BTC_NATIVE_SEGWIT_1, ""),
    percentageButtonsEnabled: false,
  },
];

test.describe("Swap - quick amount buttons", () => {
  setupEnv(true);

  const uniqueAccounts = [
    ...new Set([
      ...swapMaxBalancePairs.flatMap(({ fromAccount, toAccount }) => [fromAccount, toAccount]),
      ...insufficientBalanceSwaps.flatMap(({ swap }) => [
        swap.accountToDebit,
        swap.accountToCredit,
      ]),
    ]),
  ];
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
    "Swap max and percentage buttons follow the from-account balance",
    {
      tag: maxBalanceTags,
      annotation: { type: "TMS", description: "B2CQA-5582" },
    },
    async ({ app }) => {
      for (const { swap, percentageButtonsEnabled } of insufficientBalanceSwaps) {
        await performSwapUntilQuoteSelectionStep({ app, swap, minAmount: "" });
        await app.swap.checkMaxToggleEnabled(false);
        await app.swap.checkMaxTooltip("You don't have enough balance including network fees");
        await app.swap.checkPercentageButtonsEnabled(percentageButtonsEnabled);
      }

      for (const { fromAccountId, toAccountId } of swapMaxBalancePairs) {
        await openSwapPairViaDeeplink(app, fromAccountId, toAccountId);
        const balance = await app.swap.getFromAccountBalance();
        await app.swap.checkMaxToggleEnabled(true);
        await app.swap.checkPercentageButtonsEnabled(true);
        await app.swap.checkMaxTooltip("Max amount includes network fees");
        for (const percent of percentages) {
          await app.swap.checkPercentageFillsBalance(percent, balance);
        }
      }

      for (const percent of percentages) {
        await app.swap.checkPercentageTooltip(percent, `${percent} of your available balance`);
      }
    },
  );
});
