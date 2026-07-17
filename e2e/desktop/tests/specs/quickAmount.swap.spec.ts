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

const app: AppInfos = AppInfos.EXCHANGE;

const maxBalanceTags = [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"];

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
          await app.swap.checkPercentageButtonsEnabled(true);

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
          await app.swap.checkPercentageFillsBalance(percent, balance);
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

      await app.swap.checkPercentageButtonsEnabled(true);
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

      await app.swap.checkPercentageButtonsEnabled(false);
    },
  );
});
