import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  BTC_ACCOUNT_ID,
  ETH_ACCOUNT_ID,
  USDT_ACCOUNT_ID,
  USDT_TOKEN_ID,
} from "@ledgerhq/live-e2e-shared/swapDeeplinkFixtures";
import { swapSetup } from "../../../bridge/server";
import { setTeamOwner } from "../../../helpers/allure/allure-helper";

// Fresh session: send defaults to BTC; receive has no default ("Choose asset").
const DEFAULT_FROM = "BTC";
const DEFAULT_TO = "";

setTeamOwner(Team.SWAP);
$TmsLink("B2CQA-4152");
const tags: string[] = [
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
tags.forEach(tag => $Tag(tag));

describe("Swap - deeplinks", () => {
  const btcAccount = Account.BTC_NATIVE_SEGWIT_2;
  const ethAccount = Account.ETH_3;
  const usdtAccount = TokenAccount.ETH_USDT_1;

  beforeAll(async () => {
    await app.init({
      userdata: "swap-deeplinks",
      featureFlags: {
        ptxSwapLiveAppMobile: {
          enabled: true,
          params: {
            manifest_id:
              process.env.PRODUCTION === "true" ? "swap-live-app-aws" : "swap-live-app-stg-aws",
          },
        },
      },
    });
    await app.portfolio.waitForPortfolioPageToLoad();
    await swapSetup();
  });

  afterEach(async () => {
    await app.swapLiveApp.clearSwapState();
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  // ─── Group A: token params only, no accountIds ────────────────────────────────

  it("Swap deeplink A1 - no params, both fields default to the highest-cap asset", async () => {
    await app.swap.openViaDeeplink();
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains(DEFAULT_FROM);
    await app.swapLiveApp.checkAssetToContains(DEFAULT_TO);
  });

  it("Swap deeplink A2 - fromToken=ETH, toToken=BTC", async () => {
    await app.swap.openViaDeeplink("fromToken=ethereum&toToken=bitcoin");
    await app.modularDrawer.selectFirstAccount(); // send drawer: ETH account
    await app.modularDrawer.selectFirstAccount(); // receive drawer: BTC account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains("ETH");
    await app.swapLiveApp.checkAssetToContains("BTC");
  });

  it("Swap deeplink A3 - fromToken=USDT (ERC20), toToken=ETH", async () => {
    await app.swap.openViaDeeplink(`fromToken=${USDT_TOKEN_ID}&toToken=ethereum`);
    await app.modularDrawer.selectFirstAccount(); // send drawer: USDT/ETH account
    await app.modularDrawer.selectFirstAccount(); // receive drawer: ETH account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains("USDT");
    await app.swapLiveApp.checkAssetToContains("ETH");
  });

  it("Swap deeplink A4 - fromToken=ETH, toToken=USDT (ERC20)", async () => {
    await app.swap.openViaDeeplink(`fromToken=ethereum&toToken=${USDT_TOKEN_ID}`);
    await app.modularDrawer.selectFirstAccount(); // send drawer: ETH account
    await app.modularDrawer.selectFirstAccount(); // receive drawer: USDT/ETH account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains("ETH");
    await app.swapLiveApp.checkAssetToContains("USDT");
  });

  // A5 (FDUSD/BSC) is manual-only — no E2E account available.

  it("Swap deeplink A6 - fromToken=BTC only, receive defaults to the highest-cap asset", async () => {
    await app.swap.openViaDeeplink("fromToken=bitcoin");
    await app.modularDrawer.selectFirstAccount(); // send drawer: BTC account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains("BTC");
    await app.swapLiveApp.checkAssetToContains(DEFAULT_TO);
  });

  it("Swap deeplink A7 - toToken=ETH only, send defaults to the highest-cap asset", async () => {
    await app.swap.openViaDeeplink("toToken=ethereum");
    await app.modularDrawer.selectFirstAccount(); // receive drawer: ETH account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains(DEFAULT_FROM);
    await app.swapLiveApp.checkAssetToContains("ETH");
  });

  // ─── Group B: with amount ─────────────────────────────────────────────────────

  it("Swap deeplink B1 - ETH to BTC with a valid amountFrom", async () => {
    await app.swap.openViaDeeplink("fromToken=ethereum&toToken=bitcoin&amountFrom=0.01");
    await app.modularDrawer.selectFirstAccount(); // send drawer: ETH account
    await app.modularDrawer.selectFirstAccount(); // receive drawer: BTC account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains("ETH");
    await app.swapLiveApp.checkAssetToContains("BTC");
    jestExpect(await app.swapLiveApp.getAmountToSend()).toBe("0.01");
  });

  it("Swap deeplink B2 - ETH to BTC with an invalid amountFrom leaves the amount empty", async () => {
    await app.swap.openViaDeeplink("fromToken=ethereum&toToken=bitcoin&amountFrom=abc");
    await app.modularDrawer.selectFirstAccount(); // send drawer: ETH account
    await app.modularDrawer.selectFirstAccount(); // receive drawer: BTC account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains("ETH");
    await app.swapLiveApp.checkAssetToContains("BTC");
    jestExpect(await app.swapLiveApp.getAmountToSend()).toMatch(/^(0\.?0*|)$/);
  });

  // ─── Group C: with accountIds — no drawer expected ────────────────────────────

  it("Swap deeplink C1 - USDT to BTC with both accountIds and an amount, no drawer", async () => {
    await app.swap.openViaDeeplink(
      `fromToken=${USDT_TOKEN_ID}&toToken=bitcoin` +
        `&fromAccountId=${USDT_ACCOUNT_ID}&toAccountId=${BTC_ACCOUNT_ID}&amountFrom=20`,
    );
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromMatchesAccount(usdtAccount);
    await app.swapLiveApp.checkAssetToMatchesAccount(btcAccount);
    jestExpect(await app.swapLiveApp.getAmountToSend()).toBe("20");
  });

  it("Swap deeplink C2 - accountIds only resolve without token params, no drawer", async () => {
    await app.swap.openViaDeeplink(
      `fromAccountId=${BTC_ACCOUNT_ID}&toAccountId=${USDT_ACCOUNT_ID}`,
    );
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromMatchesAccount(btcAccount);
    await app.swapLiveApp.checkAssetToMatchesAccount(usdtAccount);
  });

  it("Swap deeplink C3 - fromAccountId only, receive defaults, no drawer", async () => {
    await app.swap.openViaDeeplink(`fromToken=${USDT_TOKEN_ID}&fromAccountId=${USDT_ACCOUNT_ID}`);
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromMatchesAccount(usdtAccount);
    await app.swapLiveApp.checkAssetToContains(DEFAULT_TO);
  });

  it("Swap deeplink C4 - toAccountId only, send defaults, no drawer", async () => {
    await app.swap.openViaDeeplink(`toToken=ethereum&toAccountId=${ETH_ACCOUNT_ID}`);
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains(DEFAULT_FROM);
    await app.swapLiveApp.checkAssetToMatchesAccount(ethAccount);
  });

  it("Swap deeplink C5 - accountId wins over a mismatching token param", async () => {
    await app.swap.openViaDeeplink(
      `fromToken=ethereum&fromAccountId=${BTC_ACCOUNT_ID}` +
        `&toToken=${USDT_TOKEN_ID}&toAccountId=${ETH_ACCOUNT_ID}`,
    );
    await app.swapLiveApp.expectSwapLiveAppForm();
    // fromAccountId takes precedence over conflicting fromToken
    await app.swapLiveApp.checkAssetFromMatchesAccount(btcAccount);
    // toAccountId takes precedence over conflicting toToken
    await app.swapLiveApp.checkAssetToMatchesAccount(ethAccount);
  });
});
