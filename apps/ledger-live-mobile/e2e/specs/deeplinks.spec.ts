import { Application } from "../page";
import { knownDevices } from "../models/devices";

let app: Application;

const ethereumLong = "ethereum";
const bitcoinLong = "bitcoin";
const arbitrumLong = "arbitrum";
const bobaLong = "boba";

$TmsLink("B2CQA-1837");
describe("DeepLinks Tests", () => {
  beforeAll(async () => {
    app = await Application.init({
      userdata: "1AccountBTC1AccountETHReadOnlyFalse",
      knownDevices: [knownDevices.nanoX],
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("should open My Ledger page", async () => {
    await app.manager.openViaDeeplink();
    await app.manager.expectManagerPage();
  });

  it("should open Account page", async () => {
    await app.account.openViaDeeplink();
    await app.accounts.waitForAccountsPageToLoad();
  });

  it("should open Add Account drawer", async () => {
    await app.addAccount.openViaDeeplink();
    await app.addAccount.selectCurrency(bitcoinLong);
  });

  it("should open ETH Account Asset page when given currency param", async () => {
    await app.account.openViaDeeplink(ethereumLong);
    await app.account.waitForAccountAssetsToLoad(ethereumLong);
  });

  it("should open BTC Account Asset page when given currency param", async () => {
    await app.account.openViaDeeplink(bitcoinLong);
    await app.account.waitForAccountAssetsToLoad(bitcoinLong);
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

  it("should open NFT Gallery", async () => {
    await app.nftGallery.openViaDeeplink();
    await app.nftGallery.expectGalleryVisible();
  });

  it("should open Swap Form page", async () => {
    await app.swap.openViaDeeplink();
    await app.swap.expectSwapPage();
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

  it("should open Receive pages", async () => {
    await app.receive.openViaDeeplink();
    await app.receive.expectFirstStep();
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.receive.receiveViaDeeplink(ethereumLong);
    await app.receive.expectSecondStepNetworks([ethereumLong, arbitrumLong, bobaLong]);
  });
});
