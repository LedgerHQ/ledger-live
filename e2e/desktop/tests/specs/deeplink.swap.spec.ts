import test from "tests/fixtures/common";
import { expect } from "@playwright/test";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-e2e-shared/enum/Account";
import { AppInfos } from "@ledgerhq/live-e2e-shared/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-e2e-shared/speculos";
import { addTmsLink } from "tests/utils/allureUtils";
import { setupEnv, selectAccountFromDeeplinkDrawer } from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import {
  BTC_ACCOUNT_ID,
  ETH_ACCOUNT_ID,
  USDT_ACCOUNT_ID,
  USDT_TOKEN_ID,
} from "@ledgerhq/live-e2e-shared/swapDeeplinkFixtures";

// On a fresh session (no prior swap), the live app defaults to the highest
// market-cap assets: BTC for the send field, ETH for the receive field.
const DEFAULT_FROM = "BTC";
const DEFAULT_TO = "Choose asset";

const TMS = "B2CQA-4152";
const TAGS = [
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
];

test.describe("Swap - deeplinks", () => {
  setupEnv(true);

  const btcAccount = Account.BTC_NATIVE_SEGWIT_2;
  const ethAccount = Account.ETH_3;
  const usdtAccount = TokenAccount.ETH_USDT_1;

  test.use({
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: AppInfos.EXCHANGE,
    cliCommandsOnApp: [
      [
        { app: btcAccount.currency.speculosApp, cmd: liveDataWithAddressCommand(btcAccount) },
        { app: ethAccount.currency.speculosApp, cmd: liveDataWithAddressCommand(ethAccount) },
        {
          app: usdtAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(usdtAccount),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    "Swap deeplinks - all scenarios",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink([TMS]);

      setExchangeDependencies([
        { name: btcAccount.currency.speculosApp.name.replace(/ /g, "_") },
        { name: ethAccount.currency.speculosApp.name.replace(/ /g, "_") },
      ]);

      // helper: reset state between scenarios
      const reset = async () => {
        await app.swap.clearSwapState();
        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.mainNavigation.validateTargetFromMainNavigation("home");
      };

      // ─── Group A: token params only, no accountIds ────────────────────────────

      await test.step("A1: no params — both fields default to highest-cap asset", async () => {
        await app.swap.openViaDeeplink("ledgerwallet://swap");
        await app.swap.checkAssetFromContains(DEFAULT_FROM);
        await app.swap.checkAssetToContains(DEFAULT_TO);
        await reset();
      });

      await test.step("A2: fromToken=ETH toToken=BTC", async () => {
        await app.swap.openViaDeeplink("ledgerwallet://swap?fromToken=ethereum&toToken=bitcoin");
        await selectAccountFromDeeplinkDrawer(app, ethAccount);
        await selectAccountFromDeeplinkDrawer(app, btcAccount);
        await app.swap.checkAssetFromContains("ETH");
        await app.swap.checkAssetToContains("BTC");
        await reset();
      });

      await test.step("A3: fromToken=USDT(ERC20) toToken=ETH", async () => {
        await app.swap.openViaDeeplink(
          `ledgerwallet://swap?fromToken=${USDT_TOKEN_ID}&toToken=ethereum`,
        );
        await selectAccountFromDeeplinkDrawer(app, usdtAccount);
        await selectAccountFromDeeplinkDrawer(app, ethAccount);
        await app.swap.checkAssetFromContains("USDT");
        await app.swap.checkAssetToContains("ETH");
        await reset();
      });

      await test.step("A4: fromToken=ETH toToken=USDT(ERC20)", async () => {
        await app.swap.openViaDeeplink(
          `ledgerwallet://swap?fromToken=ethereum&toToken=${USDT_TOKEN_ID}`,
        );
        await selectAccountFromDeeplinkDrawer(app, ethAccount);
        await selectAccountFromDeeplinkDrawer(app, usdtAccount);
        await app.swap.checkAssetFromContains("ETH");
        await app.swap.checkAssetToContains("USDT");
        await reset();
      });

      // A5 (FDUSD/BSC) is manual-only — no E2E account available.

      await test.step("A6: fromToken=BTC only — receive defaults to highest-cap asset", async () => {
        await app.swap.openViaDeeplink("ledgerwallet://swap?fromToken=bitcoin");
        await selectAccountFromDeeplinkDrawer(app, btcAccount);
        await app.swap.checkAssetFromContains("BTC");
        await app.swap.checkAssetToContains(DEFAULT_TO);
        await reset();
      });

      await test.step("A7: toToken=ETH only — send defaults to highest-cap asset", async () => {
        await app.swap.openViaDeeplink("ledgerwallet://swap?toToken=ethereum");
        await selectAccountFromDeeplinkDrawer(app, ethAccount);
        await app.swap.checkAssetFromContains(DEFAULT_FROM);
        await app.swap.checkAssetToContains("ETH");
        await reset();
      });

      // ─── Group B: with amount ──────────────────────────────────────────────────

      await test.step("B1: ETH→BTC with valid amountFrom=0.01", async () => {
        await app.swap.openViaDeeplink(
          "ledgerwallet://swap?fromToken=ethereum&toToken=bitcoin&amountFrom=0.01",
        );
        await selectAccountFromDeeplinkDrawer(app, ethAccount);
        await selectAccountFromDeeplinkDrawer(app, btcAccount);
        await app.swap.checkAssetFromContains("ETH");
        await app.swap.checkAssetToContains("BTC");
        const amount = await app.swap.getAmountToSend();
        expect(amount).toBe("0.01");
        await reset();
      });

      await test.step("B2: ETH→BTC with invalid amountFrom=abc — amount field empty or zero", async () => {
        await app.swap.openViaDeeplink(
          "ledgerwallet://swap?fromToken=ethereum&toToken=bitcoin&amountFrom=abc",
        );
        await selectAccountFromDeeplinkDrawer(app, ethAccount);
        await selectAccountFromDeeplinkDrawer(app, btcAccount);
        await app.swap.checkAssetFromContains("ETH");
        await app.swap.checkAssetToContains("BTC");
        const amount = await app.swap.getAmountToSend();
        expect(amount).toMatch(/^(0\.?0*|)$/);
        await reset();
      });

      // ─── Group C: with accountIds — no drawer expected ────────────────────────

      await test.step("C1: USDT+fromAccountId → BTC+toAccountId + amount=20, no drawer", async () => {
        await app.swap.openViaDeeplink(
          `ledgerwallet://swap?fromToken=${USDT_TOKEN_ID}&toToken=bitcoin` +
            `&fromAccountId=${USDT_ACCOUNT_ID}&toAccountId=${BTC_ACCOUNT_ID}&amountFrom=20`,
        );
        await app.swap.checkAssetFromContains(usdtAccount.currency.ticker);
        await app.swap.checkAssetFromAccountNameContains(getParentAccountName(usdtAccount));
        await app.swap.checkAssetToContains(btcAccount.currency.ticker);
        await app.swap.checkAssetToAccountNameContains(getParentAccountName(btcAccount));
        const amount = await app.swap.getAmountToSend();
        expect(amount).toBe("20");
        await reset();
      });

      await test.step("C2: fromAccountId=BTC + toAccountId=USDT (no token params) — accountId resolves, no drawer", async () => {
        await app.swap.openViaDeeplink(
          `ledgerwallet://swap?fromAccountId=${BTC_ACCOUNT_ID}&toAccountId=${USDT_ACCOUNT_ID}`,
        );
        await app.swap.checkAssetFromContains(btcAccount.currency.ticker);
        await app.swap.checkAssetFromAccountNameContains(getParentAccountName(btcAccount));
        await app.swap.checkAssetToContains(usdtAccount.currency.ticker);
        await app.swap.checkAssetToAccountNameContains(getParentAccountName(usdtAccount));
        await reset();
      });

      await test.step("C3: USDT+fromAccountId only — receive defaults, no drawer", async () => {
        await app.swap.openViaDeeplink(
          `ledgerwallet://swap?fromToken=${USDT_TOKEN_ID}&fromAccountId=${USDT_ACCOUNT_ID}`,
        );
        await app.swap.checkAssetFromContains(usdtAccount.currency.ticker);
        await app.swap.checkAssetFromAccountNameContains(getParentAccountName(usdtAccount));
        await app.swap.checkAssetToContains(DEFAULT_TO);
        await reset();
      });

      await test.step("C4: toToken=ETH+toAccountId only — send defaults, no drawer", async () => {
        await app.swap.openViaDeeplink(
          `ledgerwallet://swap?toToken=ethereum&toAccountId=${ETH_ACCOUNT_ID}`,
        );
        await app.swap.checkAssetFromContains(DEFAULT_FROM);
        await app.swap.checkAssetToContains(ethAccount.currency.ticker);
        await app.swap.checkAssetToAccountNameContains(getParentAccountName(ethAccount));
        await reset();
      });

      await test.step("C5: mismatch (fromToken=ETH+fromAccountId=BTC, toToken=USDT+toAccountId=ETH) — accountId wins", async () => {
        await app.swap.openViaDeeplink(
          `ledgerwallet://swap?fromToken=ethereum&fromAccountId=${BTC_ACCOUNT_ID}` +
            `&toToken=${USDT_TOKEN_ID}&toAccountId=${ETH_ACCOUNT_ID}`,
        );
        // fromAccountId takes precedence over conflicting fromToken
        await app.swap.checkAssetFromContains(btcAccount.currency.ticker);
        await app.swap.checkAssetFromAccountNameContains(getParentAccountName(btcAccount));
        // toAccountId takes precedence over conflicting toToken
        await app.swap.checkAssetToContains(ethAccount.currency.ticker);
        await app.swap.checkAssetToAccountNameContains(getParentAccountName(ethAccount));
        // no reset needed after last step
      });
    },
  );
});
