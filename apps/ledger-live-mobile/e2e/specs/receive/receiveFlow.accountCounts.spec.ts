import { initReceiveFlowApp, openReceive } from "./receiveFlow.shared";

describe("Receive Flow — account counts per network", () => {
  beforeAll(async () => {
    await initReceiveFlowApp();
  });

  $TmsLink("B2CQA-1858");
  $TmsLink("B2CQA-1860");
  it("Should display the number of account existing per networks", async () => {
    await openReceive();
    await app.modularDrawer.performSearchByTicker("ETH");
    await app.modularDrawer.selectCurrencyByTicker(Currency.ETH.ticker);
    await app.modularDrawer.expectNumberOfAccountInListIsDisplayed("Ethereum", 4);
    await app.modularDrawer.expectNumberOfAccountInListIsDisplayed("OP Mainnet", 1);
    await app.modularDrawer.tapDrawerCloseButton();
  });
});
