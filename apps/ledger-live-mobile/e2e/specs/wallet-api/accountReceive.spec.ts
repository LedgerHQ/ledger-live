import { afterAllWalletApi, afterEachWalletApi, beforeAllWalletApi } from "./walletApiLifecycle";

describe("Wallet API methods — account.receive", () => {
  beforeAll(beforeAllWalletApi);
  afterAll(afterAllWalletApi);
  afterEach(afterEachWalletApi);

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
