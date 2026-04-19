import { initDeeplinkSuite } from "./initDeeplinkSuite";

$TmsLink("B2CQA-1837");
describe("DeepLinks — transfer flows", () => {
  const ethereumLong = "ethereum";
  const arbitrumLong = "arbitrum";

  beforeAll(async () => {
    await initDeeplinkSuite();
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
