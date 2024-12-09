import { Application } from "../page";

const app = new Application();

describe("Wallet API methods", () => {
  beforeAll(async () => {
    await app.init({ userdata: "1AccountBTC1AccountETHReadOnlyFalse" });
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

  it("account.request", async () => {
    const { id, response } = await app.dummyWalletApp.sendAccountReceive();
    await app.walletAPIReceive.continueWithoutDevice();
    await app.walletAPIReceive.cancelNoDevice();
    await app.walletAPIReceive.continueWithoutDevice();
    await app.walletAPIReceive.confirmNoDevice();
    await expect(response).resolves.toMatchObject({
      jsonrpc: "2.0",
      id,
      result: {
        address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
      },
    });
  });

  afterAll(async () => {
    await app.dummyWalletApp.stopApp();
  });
});
