import { by, web } from "detox";
import { describeifAndroid } from "../helpers";
import { stopDummyServer } from "@ledgerhq/test-utils";
import { Application } from "../page";

let app: Application;

let continueTest: boolean;

describeifAndroid("Wallet API methods", () => {
  beforeAll(async () => {
    app = await Application.init("1AccountBTC1AccountETHReadOnlyFalse");

    // Check that dummy app in tests/dummy-app-build has been started successfully
    continueTest = await app.liveAppWebview.startLiveApp("dummy-wallet-app", 52619);
    expect(continueTest).toBeTruthy();

    // start navigation
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.discover.openViaDeeplink("dummy-live-app");

    const title = await web.element(by.web.id("image-container")).getTitle();
    expect(title).toBe("Dummy Wallet API App");

    const url = await web.element(by.web.id("param-container")).getCurrentUrl();
    expect(url).toBe("http://localhost:52619/?theme=light&lang=en&name=Dummy+Wallet+API+Live+App");
  });

  afterAll(async () => {
    await stopDummyServer();
  });

  it("account.request", async () => {
    const { id, response } = await app.liveAppWebview.send({
      method: "account.request",
      params: {
        currencyIds: ["ethereum", "bitcoin"],
      },
    });

    await app.cryptoDrawer.selectCurrencyFromDrawer("Bitcoin");
    await app.cryptoDrawer.selectAccountFromDrawer("Bitcoin 1 (legacy)");

    await expect(response).resolves.toMatchObject({
      jsonrpc: "2.0",
      id,
      result: {
        rawAccount: {
          id: "2d23ca2a-069e-579f-b13d-05bc706c7583",
          address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
          balance: "35688397",
          // TODO: Investigate why we sometimes have 195870
          //blockHeight: 194870,
          currency: "bitcoin",
          // lastSyncDate: "2020-03-14T13:34:42.000Z",
          name: "Bitcoin 1 (legacy)",
          spendableBalance: "35688397",
        },
      },
    });
  });
});
