import { Application } from "../page";

let app: Application;

describe("Wallet API methods", () => {
  beforeAll(async () => {
    app = await Application.init("1AccountBTC1AccountETHReadOnlyFalse");
    await app.dummyWalletApp.startApp();

    await app.portfolio.waitForPortfolioPageToLoad();
    await app.dummyWalletApp.openApp();
    await app.dummyWalletApp.expectApp();
  });

  it("account.request", async () => {
    const { id, response } = await app.dummyWalletApp.sendRequest();
    await app.cryptoDrawer.selectCurrencyFromDrawer("Bitcoin");
    await app.cryptoDrawer.selectAccountFromDrawer("Bitcoin 1 (legacy)");
    await app.dummyWalletApp.expectResponse(id, response);
  });

  afterAll(async () => {
    await app.dummyWalletApp.stopApp();
  });
});
