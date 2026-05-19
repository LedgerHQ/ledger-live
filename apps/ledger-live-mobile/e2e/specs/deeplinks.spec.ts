import { initDeeplinksMockApp } from "./deeplinksFlow.shared";

$TmsLink("B2CQA-1837");
describe("DeepLinks Tests", () => {
  const ethereumLong = "ethereum";
  const bitcoinLong = "bitcoin";
  const arbitrumLong = "arbitrum";

  beforeAll(async () => {
    await initDeeplinksMockApp();
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

  it("should open Receive flow", async () => {
    await app.modularDrawer.openReceiveDeeplink();
    await app.modularDrawer.checkSelectAssetPage();
    await app.modularDrawer.tapDrawerCloseButton();

    await app.modularDrawer.openReceiveDeeplink(ethereumLong);
    await app.modularDrawer.selectAccount(1);
  });

  it("should open Add Account flow", async () => {
    await app.modularDrawer.openAddAccountDeeplink();
    await app.modularDrawer.checkSelectAssetPage();
    await app.modularDrawer.tapDrawerCloseButton();
    await app.modularDrawer.openAddAccountDeeplink(ethereumLong);
    await app.modularDrawer.selectNetworkIfAsked(arbitrumLong);
  });
});
