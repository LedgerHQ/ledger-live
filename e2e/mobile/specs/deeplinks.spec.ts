import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { swapSetup } from "../bridge/server";
import { isWallet40 } from "../helpers/commonHelpers";
import { setTeamOwner } from "../helpers/allure/allure-helper";

const isSmokeTestRun = process.env.INPUTS_TEST_FILTER?.includes("@smoke");

setTeamOwner(Team.WALLET_XP);
$TmsLink("B2CQA-1837");
const tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];
tags.forEach(tag => $Tag(tag));
describe("DeepLinks Tests", () => {
  const account = Account.ETH_2;
  const ethereumLong = "ethereum";
  const bitcoinLong = "bitcoin";
  const randomLiveApp = app.discover.getRandomLiveApp();

  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
      cliCommands: [liveDataCommand(account)],
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
    await app.mainNavigation.waitForWallet40Ready();
  });

  beforeEach(async () => {
    // workaround: modular drawer blocks deeplink
    await app.modularDrawer.tapDrawerCloseButton({ onlyIfVisible: true });
  });

  beforeEach(async () => {
    // workaround: modular drawer blocks deeplink
    await app.modularDrawer.tapDrawerCloseButton({ onlyIfVisible: true });
  });

  (isSmokeTestRun ? it.skip : it)("should open My Ledger page", async () => {
    await app.manager.openViaDeeplink();
    await app.manager.expectManagerPage();
  });

  $Tag("@smoke");
  it("should open Account page", async () => {
    await app.assetAccountsPage.openViaDeeplink();
    await app.accounts.waitForAccountsPageToLoad();
  });

  (isSmokeTestRun ? it.skip : it)(
    "should open ETH Account Asset page when given currency param",
    async () => {
      await app.assetAccountsPage.openViaDeeplink(ethereumLong);
      await app.assetAccountsPage.waitForAccountAssetsToLoad(ethereumLong);
    },
  );

  (isSmokeTestRun ? it.skip : it)(
    "should open BTC Account Asset page when given currency param",
    async () => {
      await app.assetAccountsPage.openViaDeeplink(bitcoinLong);
      await app.assetAccountsPage.waitForAccountAssetsToLoad(bitcoinLong);
    },
  );

  (isSmokeTestRun ? it.skip : it)("should open Custom Lock Screen page", async () => {
    await app.customLockscreen.openViaDeeplink();
    await app.customLockscreen.expectCustomLockscreenPage();
  });

  (isSmokeTestRun ? it.skip : it)(
    `should open the Discover page and search for ${randomLiveApp}`,
    async () => {
      await app.discover.openViaDeeplink();
      await app.discover.typeInCatalogSearchBar(randomLiveApp);
      await app.discover.expectCatalogAppCard(randomLiveApp);
      if (isWallet40) await app.discover.catalogSearchCancelButton().tap();
      else await app.discover.goBackFromCatalogSearch();

      await app.discover.expectDiscoverPage();
    },
  );

  (isSmokeTestRun ? it.skip : it)(
    `should open discovery to ${randomLiveApp} live App`,
    async () => {
      await app.discover.openViaDeeplink(randomLiveApp);
      await app.discover.expectApp(randomLiveApp);
    },
  );

  (isSmokeTestRun ? it.skip : it)("should open discovery to Kiln Widget live App", async () => {
    await app.discover.openViaDeeplink("Kiln-Widget");
    await app.discover.expectApp("Kiln-Widget");
  });

  setTeamOwner(Team.SWAP);
  (isSmokeTestRun ? it.skip : it)("should open Swap Form page", async () => {
    await swapSetup();
    await app.swap.openViaDeeplink();
    await app.swapLiveApp.expectSwapLiveApp();
  });

  (isSmokeTestRun ? it.skip : it)("should open Market Detail page for Bitcoin", async () => {
    await app.market.openViaDeeplink("bitcoin");
    await app.market.expectMarketDetailPage();
  });

  (isSmokeTestRun ? it.skip : it)("should open Send pages", async () => {
    await app.send.openViaDeeplink();
    await app.send.expectFirstStep();
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.send.sendViaDeeplink(ethereumLong);
    await app.send.expectFirstStep();
    await app.common.expectSearch(ethereumLong);
  });

  (isSmokeTestRun ? it.skip : it)("should open Asset page for Bitcoin", async () => {
    await app.assetAccountsPage.openAssetPageViaDeeplink(bitcoinLong);
    await app.assetAccountsPage.expectAssetPage(bitcoinLong);
  });

  (isSmokeTestRun ? it.skip : it)("should open Asset page for Ethereum", async () => {
    await app.assetAccountsPage.openAssetPageViaDeeplink(ethereumLong);
    await app.assetAccountsPage.expectAssetPage(ethereumLong);
  });

  (isSmokeTestRun ? describe.skip : describe)("Open modular drawer via deeplinks", () => {
    const TOP_CRYPTO_TICKERS = ["BTC", "ETH", "USDT", "XRP", "BNB"];

    it("should open from Add Account", async () => {
      await app.addAccount.openViaDeeplink();
      await app.modularDrawer.validateAssetsScreen(TOP_CRYPTO_TICKERS);
    });

    it("should open from Receive", async () => {
      await app.receive.openViaDeeplink();
      await app.modularDrawer.validateAssetsScreen(TOP_CRYPTO_TICKERS);
    });

    it("should open from Receive in a selected account", async () => {
      await app.mainNavigation.openPortfolioViaDeeplink();
      await app.receive.receiveViaDeeplink(ethereumLong);
      await app.modularDrawer.validateAccountsScreen([account.accountName]);
    });
  });
});
