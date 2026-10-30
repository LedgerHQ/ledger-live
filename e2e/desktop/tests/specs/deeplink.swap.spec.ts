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
import { setupEnv, selectAccountFromDeeplinkDrawer } from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import {
  BTC_ACCOUNT_ID,
  ETH_ACCOUNT_ID,
  USDT_ACCOUNT_ID,
  USDT_TOKEN_ID,
} from "@ledgerhq/live-e2e-shared/swapDeeplinkFixtures";

// On a fresh session (no prior swap), the live app defaults the send field to
// the highest market-cap asset and leaves the receive field empty.
const DEFAULT_FROM = Currency.BTC.ticker;
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
  const usdtOnEthAccount = TokenAccount.ETH_USDT_3;
  const btc = btcAccount.currency;
  const eth = ethAccount.currency;
  const usdt = usdtAccount.currency;

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

      // ─── Token params only, no accountIds ────────────────────────────

      await app.swap.openViaDeeplink("ledgerwallet://swap");
      await app.swap.checkAssetFromContains(DEFAULT_FROM);
      await app.swap.checkAssetToContains(DEFAULT_TO);
      await reset();

      await app.swap.openViaDeeplink(`ledgerwallet://swap?fromToken=${eth.id}&toToken=${btc.id}`);
      await selectAccountFromDeeplinkDrawer(app, ethAccount);
      await selectAccountFromDeeplinkDrawer(app, btcAccount);
      await app.swap.checkAssetFromContains(eth.ticker);
      await app.swap.checkAssetToContains(btc.ticker);
      await reset();

      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromToken=${USDT_TOKEN_ID}&toToken=${eth.id}`,
      );
      await selectAccountFromDeeplinkDrawer(app, usdtAccount);
      await selectAccountFromDeeplinkDrawer(app, ethAccount);
      await app.swap.checkAssetFromContains(usdt.ticker);
      await app.swap.checkAssetToContains(eth.ticker);
      await reset();

      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromToken=${eth.id}&toToken=${USDT_TOKEN_ID}`,
      );
      await selectAccountFromDeeplinkDrawer(app, ethAccount);
      await selectAccountFromDeeplinkDrawer(app, usdtAccount);
      await app.swap.checkAssetFromContains(eth.ticker);
      await app.swap.checkAssetToContains(usdt.ticker);
      await reset();

      // The FDUSD/BSC case is manual-only — no E2E account available.

      await app.swap.openViaDeeplink(`ledgerwallet://swap?fromToken=${btc.id}`);
      await selectAccountFromDeeplinkDrawer(app, btcAccount);
      await app.swap.checkAssetFromContains(btc.ticker);
      await app.swap.checkAssetToContains(DEFAULT_TO);
      await reset();

      await app.swap.openViaDeeplink(`ledgerwallet://swap?toToken=${eth.id}`);
      await selectAccountFromDeeplinkDrawer(app, ethAccount);
      await app.swap.checkAssetFromContains(DEFAULT_FROM);
      await app.swap.checkAssetToContains(eth.ticker);
      await reset();

      // ─── With amount ──────────────────────────────────────────────────

      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromToken=${eth.id}&toToken=${btc.id}&amountFrom=0.01`,
      );
      await selectAccountFromDeeplinkDrawer(app, ethAccount);
      await selectAccountFromDeeplinkDrawer(app, btcAccount);
      await app.swap.checkAssetFromContains(eth.ticker);
      await app.swap.checkAssetToContains(btc.ticker);
      await app.swap.checkAmountToSend("0.01");
      await reset();

      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromToken=${eth.id}&toToken=${btc.id}&amountFrom=abc`,
      );
      await selectAccountFromDeeplinkDrawer(app, ethAccount);
      await selectAccountFromDeeplinkDrawer(app, btcAccount);
      await app.swap.checkAssetFromContains(eth.ticker);
      await app.swap.checkAssetToContains(btc.ticker);
      await app.swap.checkAmountToSend(/^(0\.?0*|)$/);
      await reset();

      // ─── With accountIds — no drawer expected ────────────────────────

      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromToken=${USDT_TOKEN_ID}&toToken=${btc.id}` +
          `&fromAccountId=${USDT_ACCOUNT_ID}&toAccountId=${BTC_ACCOUNT_ID}&amountFrom=20`,
      );
      await app.swap.checkAssetFromContains(usdt.ticker);
      await app.swap.checkAssetFromAccountNameContains(getParentAccountName(usdtAccount));
      await app.swap.checkAssetToContains(btc.ticker);
      await app.swap.checkAssetToAccountNameContains(getParentAccountName(btcAccount));
      await app.swap.checkAmountToSend("20");
      await reset();

      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromAccountId=${BTC_ACCOUNT_ID}&toAccountId=${USDT_ACCOUNT_ID}`,
      );
      await app.swap.checkAssetFromContains(btc.ticker);
      await app.swap.checkAssetFromAccountNameContains(getParentAccountName(btcAccount));
      await app.swap.checkAssetToContains(usdt.ticker);
      await app.swap.checkAssetToAccountNameContains(getParentAccountName(usdtAccount));
      await reset();

      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromToken=${USDT_TOKEN_ID}&fromAccountId=${USDT_ACCOUNT_ID}`,
      );
      await app.swap.checkAssetFromContains(usdt.ticker);
      await app.swap.checkAssetFromAccountNameContains(getParentAccountName(usdtAccount));
      await app.swap.checkAssetToContains(DEFAULT_TO);
      await reset();

      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?toToken=${eth.id}&toAccountId=${ETH_ACCOUNT_ID}`,
      );
      await app.swap.checkAssetFromContains(DEFAULT_FROM);
      await app.swap.checkAssetToContains(eth.ticker);
      await app.swap.checkAssetToAccountNameContains(getParentAccountName(ethAccount));
      await reset();

      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromToken=${eth.id}&fromAccountId=${BTC_ACCOUNT_ID}` +
          `&toToken=${USDT_TOKEN_ID}&toAccountId=${ETH_ACCOUNT_ID}`,
      );
      // fromAccountId takes precedence over conflicting fromToken
      await app.swap.checkAssetFromContains(btc.ticker);
      await app.swap.checkAssetFromAccountNameContains(getParentAccountName(btcAccount));
      // toToken on the toAccountId network is received on that account
      await app.swap.checkAssetToContains(usdtOnEthAccount.currency.ticker);
      await app.swap.checkAssetToAccountNameContains(getParentAccountName(usdtOnEthAccount));
      // no reset needed after last step
    },
  );
});
