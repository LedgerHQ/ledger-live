import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-e2e-shared/speculos";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { setupEnv, performSwapUntilQuoteSelectionStep } from "tests/utils/swapUtils";
import { parseBalanceAmount } from "tests/utils/amountUtils";
import { expect } from "@playwright/test";
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

test.describe("Swap - quick amount buttons", () => {
  setupEnv(true);

  const uniqueAccounts = [Account.ETH_3, Account.BTC_NATIVE_SEGWIT_2, TokenAccount.ETH_USDT_1];
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
    "Swap balance is visible and max/percentage buttons are enabled",
    {
      tag: maxBalanceTags,
      annotation: { type: "TMS", description: "B2CQA-5582" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      for (const { fromAccount, fromAccountId, toAccountId } of swapMaxBalancePairs) {
        await test.step(`Currency: ${fromAccount.currency.name}`, async () => {
          await openSwapPairViaDeeplink(app, fromAccountId, toAccountId);

          const balanceText = await app.swap.getFromAccountBalanceText();
          expect(balanceText).toBeTruthy();

          expect(await app.swap.isMaxToggleEnabled()).toBe(true);
          await app.swap.checkPercentageButtonsEnabled(true);

          await app.swap.checkMaxTooltip("Max amount includes network fees");
        });
      }
    },
  );

  test(
    "Swap percentage buttons show the correct tooltip",
    {
      tag: maxBalanceTags,
      annotation: { type: "TMS", description: "B2CQA-5582" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const { fromAccountId, toAccountId } = swapMaxBalancePairs[0];
      await openSwapPairViaDeeplink(app, fromAccountId, toAccountId);

      for (const percent of ["25%", "50%", "75%"] as const) {
        await app.swap.checkPercentageTooltip(percent, `${percent} of your available balance`);
      }
    },
  );

  test(
    "Swap percentage buttons fill the proportional amount of the balance",
    {
      tag: maxBalanceTags,
      annotation: { type: "TMS", description: "B2CQA-5582" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      for (const { fromAccountId, toAccountId } of swapMaxBalancePairs) {
        await openSwapPairViaDeeplink(app, fromAccountId, toAccountId);

        const balanceText = await app.swap.getFromAccountBalanceText();
        const balance = parseBalanceAmount(balanceText);

        for (const percent of ["25%", "50%", "75%"] as const) {
          await app.swap.checkPercentageFillsBalance(percent, balance);
        }
      }
    },
  );
});

test.describe("Swap - quick amount buttons", () => {
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
    "Swap max is disabled while percentage buttons stay enabled",
    {
      tag: maxBalanceTags,
      annotation: { type: "TMS", description: "B2CQA-5582" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await performSwapUntilQuoteSelectionStep(app, new Swap(fromAccount, toAccount, ""), "");

      expect(await app.swap.isMaxToggleEnabled()).toBe(false);
      await app.swap.checkMaxTooltip("You don't have enough balance including network fees");

      await app.swap.checkPercentageButtonsEnabled(true);
    },
  );
});

test.describe("Swap - quick amount buttons", () => {
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
    "Swap max and percentage buttons are disabled on a zero-balance token account",
    {
      tag: maxBalanceTags,
      annotation: { type: "TMS", description: "B2CQA-5582" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await performSwapUntilQuoteSelectionStep(app, new Swap(fromAccount, toAccount, ""), "");

      expect(await app.swap.isMaxToggleEnabled()).toBe(false);
      await app.swap.checkMaxTooltip("You don't have enough balance including network fees");

      await app.swap.checkPercentageButtonsEnabled(false);
    },
  );
});
