import { afterAllWalletApi, afterEachWalletApi, beforeAllWalletApi } from "./walletApiLifecycle";

describe("Wallet API methods — account.request", () => {
  beforeAll(beforeAllWalletApi);
  afterAll(afterAllWalletApi);
  afterEach(afterEachWalletApi);

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
});
