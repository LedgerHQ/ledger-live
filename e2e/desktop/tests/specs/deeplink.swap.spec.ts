import test from "tests/fixtures/common";
import { expect } from "@playwright/test";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import {
  setupEnv,
  selectAccountFromDeeplinkDrawer,
  closeDeeplinkDrawer,
} from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";

// Account UUIDs derived from the E2E test seed via uuidv5 (namespace c3c78073-…).
// Must match the accounts loaded by cliCommandsOnApp below.
const BTC_ACCOUNT_ID = "62d8d0c0-3550-5f0c-9755-c6fb7866828b";
const ETH_ACCOUNT_ID = "1258dc17-fbc6-5a99-ba85-2969da766f65";
const USDT_ACCOUNT_ID = "84024965-a385-52d5-90cd-38dfc8bab5e9";

const USDT_TOKEN_ID = "ethereum/erc20/usd_tether__erc20_";

// On a fresh session (no prior swap), the live app defaults to the highest
// market-cap assets: BTC for the send field, ETH for the receive field.
const DEFAULT_FROM = "BTC";
const DEFAULT_TO = "";

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

test.describe.configure({ mode: "serial" });

test.describe("[B2CQA-4152] Swap deeplinks — LWD", () => {
  setupEnv(true);

  const btcAccount = Account.BTC_NATIVE_SEGWIT_2;
  const ethAccount = Account.ETH_3;
  const usdtAccount = TokenAccount.ETH_USDT_1;

  test.beforeEach(async () => {
    setExchangeDependencies([
      { name: btcAccount.currency.speculosApp.name.replace(/ /g, "_") },
      { name: ethAccount.currency.speculosApp.name.replace(/ /g, "_") },
    ]);
  });

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

  // Navigate to home before each test so the swap live app is unmounted,
  // ensuring no prior-selection state bleeds into the next test.
  test.beforeEach(async ({ app }) => {
    await app.mainNavigation.openTargetFromMainNavigation("home");
  });

  // ─── Group A: token params only, no accountIds ──────────────────────────────

  test(
    "A1: no params — both fields default to highest-cap asset",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink("ledgerwallet://swap");
      await app.swap.checkAssetFromContains(DEFAULT_FROM);
      await app.swap.checkAssetToContains(DEFAULT_TO);
    },
  );

  test(
    "A2: fromToken=ETH toToken=BTC",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink("ledgerwallet://swap?fromToken=ethereum&toToken=bitcoin");
      await selectAccountFromDeeplinkDrawer(app, ethAccount);
      await selectAccountFromDeeplinkDrawer(app, btcAccount);
      await app.swap.checkAssetFromContains("ETH");
      await app.swap.checkAssetToContains("BTC");
    },
  );

  test(
    "A3: fromToken=USDT(ERC20) toToken=ETH",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromToken=${USDT_TOKEN_ID}&toToken=ethereum`,
      );
      await selectAccountFromDeeplinkDrawer(app, usdtAccount);
      await selectAccountFromDeeplinkDrawer(app, ethAccount);
      await app.swap.checkAssetFromContains("USDT");
      await app.swap.checkAssetToContains("ETH");
    },
  );

  test(
    "A4: fromToken=ETH toToken=USDT(ERC20)",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromToken=ethereum&toToken=${USDT_TOKEN_ID}`,
      );
      await selectAccountFromDeeplinkDrawer(app, ethAccount);
      await selectAccountFromDeeplinkDrawer(app, usdtAccount);
      await app.swap.checkAssetFromContains("ETH");
      await app.swap.checkAssetToContains("USDT");
    },
  );

  // A5 (FDUSD/BSC) is manual-only — no E2E account available.

  test(
    "A6: fromToken=BTC only — receive defaults to highest-cap asset",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink("ledgerwallet://swap?fromToken=bitcoin");
      await selectAccountFromDeeplinkDrawer(app, btcAccount);
      await app.swap.checkAssetFromContains("BTC");
      await app.swap.checkAssetToContains(DEFAULT_TO);
    },
  );

  test(
    "A7: toToken=ETH only — send defaults to highest-cap asset",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink("ledgerwallet://swap?toToken=ethereum");
      await selectAccountFromDeeplinkDrawer(app, ethAccount);
      await app.swap.checkAssetFromContains(DEFAULT_FROM);
      await app.swap.checkAssetToContains("ETH");
    },
  );

  test(
    "A8: fromToken=INVALID(123) toToken=BTC — invalid send defaults",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink("ledgerwallet://swap?fromToken=123&toToken=bitcoin");
      await closeDeeplinkDrawer(app); // fromToken=123 is invalid — close its drawer
      await selectAccountFromDeeplinkDrawer(app, btcAccount); // receive drawer: BTC account
      await app.swap.checkAssetFromContains(DEFAULT_FROM);
      await app.swap.checkAssetToContains("BTC");
    },
  );

  test(
    "A9: fromToken=ETH toToken=INVALID(456) — invalid receive defaults",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink("ledgerwallet://swap?fromToken=ethereum&toToken=456");
      await selectAccountFromDeeplinkDrawer(app, ethAccount); // only send drawer; invalid to has no drawer
      await app.swap.checkAssetFromContains("ETH");
      await app.swap.checkAssetToContains(DEFAULT_TO);
    },
  );

  test(
    "A10: fromToken=INVALID toToken=INVALID — both default",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink("ledgerwallet://swap?fromToken=123&toToken=456");
      await app.swap.checkAssetFromContains(DEFAULT_FROM);
      await app.swap.checkAssetToContains(DEFAULT_TO);
    },
  );

  // ─── Group B: with amount ────────────────────────────────────────────────────

  test(
    "B1: ETH→BTC with valid amountFrom=0.01",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink(
        "ledgerwallet://swap?fromToken=ethereum&toToken=bitcoin&amountFrom=0.01",
      );
      await selectAccountFromDeeplinkDrawer(app, ethAccount);
      await selectAccountFromDeeplinkDrawer(app, btcAccount);
      await app.swap.checkAssetFromContains("ETH");
      await app.swap.checkAssetToContains("BTC");
      const amount = await app.swap.getAmountToSend();
      expect(amount).toBe("0.01");
    },
  );

  test(
    "B2: ETH→BTC with invalid amountFrom=abc — amount field empty or zero",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink(
        "ledgerwallet://swap?fromToken=ethereum&toToken=bitcoin&amountFrom=abc",
      );
      await selectAccountFromDeeplinkDrawer(app, ethAccount);
      await selectAccountFromDeeplinkDrawer(app, btcAccount);
      await app.swap.checkAssetFromContains("ETH");
      await app.swap.checkAssetToContains("BTC");
      const amount = await app.swap.getAmountToSend();
      expect(amount).toMatch(/^(0\.?0*|)$/);
    },
  );

  // ─── Group C: with accountIds — no drawer expected ──────────────────────────

  test(
    "C1: USDT+fromAccountId → BTC+toAccountId + amount=20, no drawer",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromToken=${USDT_TOKEN_ID}&toToken=bitcoin` +
          `&fromAccountId=${USDT_ACCOUNT_ID}&toAccountId=${BTC_ACCOUNT_ID}&amountFrom=20`,
      );
      await app.swap.checkAssetFromContains(getParentAccountName(usdtAccount));
      await app.swap.checkAssetToContains(getParentAccountName(btcAccount));
      const amount = await app.swap.getAmountToSend();
      expect(amount).toBe("20");
    },
  );

  test(
    "C2: fromAccountId=BTC + toAccountId=USDT (no token params) — accountId resolves, no drawer",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromAccountId=${BTC_ACCOUNT_ID}&toAccountId=${USDT_ACCOUNT_ID}`,
      );
      await app.swap.checkAssetFromContains(getParentAccountName(btcAccount));
      await app.swap.checkAssetToContains(getParentAccountName(usdtAccount));
    },
  );

  test(
    "C3: USDT+fromAccountId only — receive defaults, no drawer",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromToken=${USDT_TOKEN_ID}&fromAccountId=${USDT_ACCOUNT_ID}`,
      );
      await app.swap.checkAssetFromContains(getParentAccountName(usdtAccount));
      await app.swap.checkAssetToContains(DEFAULT_TO);
    },
  );

  test(
    "C4: toToken=ETH+toAccountId only — send defaults, no drawer",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?toToken=ethereum&toAccountId=${ETH_ACCOUNT_ID}`,
      );
      await app.swap.checkAssetFromContains(DEFAULT_FROM);
      await app.swap.checkAssetToContains(getParentAccountName(ethAccount));
    },
  );

  test(
    "C5: mismatch (fromToken=ETH+fromAccountId=BTC, toToken=USDT+toAccountId=ETH) — accountId wins",
    { tag: TAGS, annotation: { type: "TMS", description: TMS } },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.openViaDeeplink(
        `ledgerwallet://swap?fromToken=ethereum&fromAccountId=${BTC_ACCOUNT_ID}` +
          `&toToken=${USDT_TOKEN_ID}&toAccountId=${ETH_ACCOUNT_ID}`,
      );
      // fromAccountId takes precedence over conflicting fromToken
      await app.swap.checkAssetFromContains(getParentAccountName(btcAccount));
      // toAccountId takes precedence over conflicting toToken
      await app.swap.checkAssetToContains(getParentAccountName(ethAccount));
    },
  );
});
