describe("Wallet API methods", () => {
  beforeAll(async () => {
    await app.init({ userdata: "1AccountBTC1AccountETHReadOnlyFalse" });
    await app.dummyWalletApp.startApp();

    await app.portfolio.waitForPortfolioPageToLoad();
    await app.dummyWalletApp.openApp();
    await app.dummyWalletApp.expectApp();
  });

  afterAll(async () => {
    await app.dummyWalletApp.stopApp();
  });

  afterEach(async () => {
    await app.dummyWalletApp.clearStates();
  });

  it("account.request", async () => {
    await app.dummyWalletApp.sendRequest();
    await app.cryptoDrawer.selectCurrencyFromDrawer("Bitcoin");
    await app.cryptoDrawer.selectAccountFromDrawer("Bitcoin 1 (legacy)");

    const res = await app.dummyWalletApp.getResOutput();
    expect(res).toMatchObject({
      id: "2d23ca2a-069e-579f-b13d-05bc706c7583",
      address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
      balance: "35688397",
      blockHeight: 194870,
      currency: "bitcoin",
      name: "Bitcoin 1 (legacy)",
      spendableBalance: "35688397",
    });
  });

  it("account.receive", async () => {
    await app.dummyWalletApp.sendAccountReceive();
    await app.walletAPIReceive.continueWithoutDevice();
    await app.walletAPIReceive.cancelNoDevice();
    await app.walletAPIReceive.continueWithoutDevice();
    await app.walletAPIReceive.confirmNoDevice();

    const res = await app.dummyWalletApp.getResOutput();
    expect(res).toBe("1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ");
  });
});
