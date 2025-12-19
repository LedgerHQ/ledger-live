import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { waitSwapReady } from "../bridge/server";

$TmsLink("B2CQA-1837");
const tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];
tags.forEach(tag => $Tag(tag));
describe("DeepLinks Tests", () => {
  const nanoApp = AppInfos.ETHEREUM;
  const ethereumLong = "ethereum";
  const bitcoinLong = "bitcoin";

  beforeAll(async () => {
    await app.init({
      speculosApp: nanoApp,
      cliCommands: [
        async (userdataPath?: string) => {
          return CLI.liveData({
            currency: nanoApp.name,
            index: 0,
            appjson: userdataPath,
            add: true,
          });
        },
      ],
      featureFlags: {
        ptxSwapLiveAppMobile: {
          enabled: true,
          params: {
            manifest_id:
              process.env.PRODUCTION === "true"
                ? "swap-live-app-demo-3"
                : "swap-live-app-demo-3-stg",
          },
        },
      },
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("should open My Ledger page", async () => {
    await app.manager.openViaDeeplink();
    await app.manager.expectManagerPage();
  });

  it("should open Account page", async () => {
    await app.assetAccountsPage.openViaDeeplink();
    await app.accounts.waitForAccountsPageToLoad();
  });

  it("should open ETH Account Asset page when given currency param", async () => {
    await app.assetAccountsPage.openViaDeeplink(ethereumLong);
    await app.assetAccountsPage.waitForAccountAssetsToLoad(ethereumLong);
  });

  it("should open BTC Account Asset page when given currency param", async () => {
    await app.assetAccountsPage.openViaDeeplink(bitcoinLong);
    await app.assetAccountsPage.waitForAccountAssetsToLoad(bitcoinLong);
  });

  it("should open Custom Lock Screen page", async () => {
    await app.customLockscreen.openViaDeeplink();
    await app.customLockscreen.expectCustomLockscreenPage();
  });

  it("should open the Discover page", async () => {
    await app.discover.openViaDeeplink();
    await app.discover.expectDiscoverPage();
  });

  it(`should open discovery to random live App`, async () => {
    // Opening only one random liveApp to avoid flakiness
    const randomLiveApp = app.discover.getRandomLiveApp();
    await app.discover.openViaDeeplink(randomLiveApp);
    await app.discover.expectApp(randomLiveApp);
  });

  it("should open Swap Form page", async () => {
    await app.swap.openViaDeeplink();
    await waitSwapReady();
    await app.swap.expectSwapPage();
  });

  it("should open Market Detail page for Bitcoin", async () => {
    await app.market.openViaDeeplink("bitcoin");
    await app.market.expectMarketDetailPage();
  });

  it("should open Send pages", async () => {
    await app.send.openViaDeeplink();
    await app.send.expectFirstStep();
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.send.sendViaDeeplink(ethereumLong);
    await app.send.expectFirstStep();
    await app.common.expectSearch(ethereumLong);
  });

  it("should open Asset page for Bitcoin", async () => {
    await app.assetAccountsPage.openAssetPageViaDeeplink(bitcoinLong);
    await app.assetAccountsPage.expectAssetPage(bitcoinLong);
  });

  it("should open Asset page for Ethereum", async () => {
    await app.assetAccountsPage.openAssetPageViaDeeplink(ethereumLong);
    await app.assetAccountsPage.expectAssetPage(ethereumLong);
  });

  describe("Open modular drawer via deeplinks", () => {
    const TOP_CRYPTO_TICKERS = ["BTC", "ETH", "USDT", "XRP", "BNB"];

    beforeEach(async () => {
      await app.modularDrawer.tapDrawerCloseButton({ onlyIfVisible: true });
    });

    it("should open from Add Account", async () => {
      await app.addAccount.openViaDeeplink();
      await app.modularDrawer.validateAssetsScreen(TOP_CRYPTO_TICKERS);
      await app.modularDrawer.tapDrawerCloseButton();
    });

    it("should open from Receive", async () => {
      await app.receive.openViaDeeplink();
      await app.modularDrawer.validateAssetsScreen(TOP_CRYPTO_TICKERS);
      await app.modularDrawer.tapDrawerCloseButton();
    });

    it("should open from Receive in a selected account", async () => {
      await app.portfolio.openViaDeeplink();
      await app.portfolio.waitForPortfolioPageToLoad();
      await app.receive.receiveViaDeeplink(ethereumLong);
      await app.modularDrawer.validateAccountsScreen([Account.ETH_1.accountName]);
    });
  });
});
