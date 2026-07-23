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

describe("Swap deeplinks", () => {
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

  it("Swap deeplinks — all scenarios", async () => {
    const reset = async () => {
      await app.swapLiveApp.clearSwapState();
      await app.portfolio.openViaDeeplink();
      await app.portfolio.waitForPortfolioPageToLoad();
    };

    // ─── Group A: token params only, no accountIds ──────────────────────────────

    // A1: no params — both fields default to highest-cap asset
    await app.swap.openViaDeeplink();
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains(DEFAULT_FROM);
    await app.swapLiveApp.checkAssetToContains(DEFAULT_TO);
    await reset();

    // A2: fromToken=ETH toToken=BTC
    await app.swap.openViaDeeplink("fromToken=ethereum&toToken=bitcoin");
    await app.modularDrawer.selectFirstAccount(); // send drawer: ETH account
    await app.modularDrawer.selectFirstAccount(); // receive drawer: BTC account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains("ETH");
    await app.swapLiveApp.checkAssetToContains("BTC");
    await reset();

    // A3: fromToken=USDT(ERC20) toToken=ETH
    await app.swap.openViaDeeplink(`fromToken=${USDT_TOKEN_ID}&toToken=ethereum`);
    await app.modularDrawer.selectFirstAccount(); // send drawer: USDT/ETH account
    await app.modularDrawer.selectFirstAccount(); // receive drawer: ETH account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains("USDT");
    await app.swapLiveApp.checkAssetToContains("ETH");
    await reset();

    // A4: fromToken=ETH toToken=USDT(ERC20)
    await app.swap.openViaDeeplink(`fromToken=ethereum&toToken=${USDT_TOKEN_ID}`);
    await app.modularDrawer.selectFirstAccount(); // send drawer: ETH account
    await app.modularDrawer.selectFirstAccount(); // receive drawer: USDT/ETH account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains("ETH");
    await app.swapLiveApp.checkAssetToContains("USDT");
    await reset();

    // A5 (FDUSD/BSC) is manual-only — no E2E account available.

    // A6: fromToken=BTC only — receive defaults to highest-cap asset
    await app.swap.openViaDeeplink("fromToken=bitcoin");
    await app.modularDrawer.selectFirstAccount(); // send drawer: BTC account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains("BTC");
    await app.swapLiveApp.checkAssetToContains(DEFAULT_TO);
    await reset();

    // A7: toToken=ETH only — send defaults to highest-cap asset
    await app.swap.openViaDeeplink("toToken=ethereum");
    await app.modularDrawer.selectFirstAccount(); // receive drawer: ETH account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains(DEFAULT_FROM);
    await app.swapLiveApp.checkAssetToContains("ETH");
    await reset();

    // ─── Group B: with amount ────────────────────────────────────────────────────

    // B1: ETH→BTC with valid amountFrom=0.01
    await app.swap.openViaDeeplink("fromToken=ethereum&toToken=bitcoin&amountFrom=0.01");
    await app.modularDrawer.selectFirstAccount(); // send drawer: ETH account
    await app.modularDrawer.selectFirstAccount(); // receive drawer: BTC account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains("ETH");
    await app.swapLiveApp.checkAssetToContains("BTC");
    jestExpect(await app.swapLiveApp.getAmountToSend()).toBe("0.01");
    await reset();

    // B2: ETH→BTC with invalid amountFrom=abc — amount field empty or zero
    await app.swap.openViaDeeplink("fromToken=ethereum&toToken=bitcoin&amountFrom=abc");
    await app.modularDrawer.selectFirstAccount(); // send drawer: ETH account
    await app.modularDrawer.selectFirstAccount(); // receive drawer: BTC account
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains("ETH");
    await app.swapLiveApp.checkAssetToContains("BTC");
    jestExpect(await app.swapLiveApp.getAmountToSend()).toMatch(/^(0\.?0*|)$/);
    await reset();

    // ─── Group C: with accountIds — no drawer expected ──────────────────────────

    // C1: USDT+fromAccountId → BTC+toAccountId + amount=20, no drawer
    await app.swap.openViaDeeplink(
      `fromToken=${USDT_TOKEN_ID}&toToken=bitcoin` +
        `&fromAccountId=${USDT_ACCOUNT_ID}&toAccountId=${BTC_ACCOUNT_ID}&amountFrom=20`,
    );
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromMatchesAccount(usdtAccount);
    await app.swapLiveApp.checkAssetToMatchesAccount(btcAccount);
    jestExpect(await app.swapLiveApp.getAmountToSend()).toBe("20");
    await reset();

    // C2: fromAccountId=BTC + toAccountId=USDT (no token params) — accountId resolves, no drawer
    await app.swap.openViaDeeplink(
      `fromAccountId=${BTC_ACCOUNT_ID}&toAccountId=${USDT_ACCOUNT_ID}`,
    );
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromMatchesAccount(btcAccount);
    await app.swapLiveApp.checkAssetToMatchesAccount(usdtAccount);
    await reset();

    // C3: USDT+fromAccountId only — receive defaults, no drawer
    await app.swap.openViaDeeplink(`fromToken=${USDT_TOKEN_ID}&fromAccountId=${USDT_ACCOUNT_ID}`);
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromMatchesAccount(usdtAccount);
    await app.swapLiveApp.checkAssetToContains(DEFAULT_TO);
    await reset();

    // C4: toToken=ETH+toAccountId only — send defaults, no drawer
    await app.swap.openViaDeeplink(`toToken=ethereum&toAccountId=${ETH_ACCOUNT_ID}`);
    await app.swapLiveApp.expectSwapLiveAppForm();
    await app.swapLiveApp.checkAssetFromContains(DEFAULT_FROM);
    await app.swapLiveApp.checkAssetToMatchesAccount(ethAccount);
    await reset();

    // C5: mismatch (fromToken=ETH+fromAccountId=BTC, toToken=USDT+toAccountId=ETH) — accountId wins
    await app.swap.openViaDeeplink(
      `fromToken=ethereum&fromAccountId=${BTC_ACCOUNT_ID}` +
        `&toToken=${USDT_TOKEN_ID}&toAccountId=${ETH_ACCOUNT_ID}`,
    );
    await app.swapLiveApp.expectSwapLiveAppForm();
    // fromAccountId takes precedence over conflicting fromToken
    await app.swapLiveApp.checkAssetFromMatchesAccount(btcAccount);
    // toAccountId takes precedence over conflicting toToken
    await app.swapLiveApp.checkAssetToMatchesAccount(ethAccount);
    // no reset needed after last scenario
  });
});
