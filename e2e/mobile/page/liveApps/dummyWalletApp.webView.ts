import { send, startLiveApp, stopServer } from "../../models/liveApps";
import DiscoverPage from "../discover/discover.page";

const port = 52619;

export default class DummyWalletApp {
  async startApp() {
    const continueTest = await startLiveApp("dummy-wallet-app", port);
    // Check that dummy app in tests/dummy-app-build has been started successfully
    jestExpect(continueTest).toBeTruthy();
  }

  async openApp() {
    await new DiscoverPage().openViaDeeplink("dummy-live-app");
  }

  async expectApp() {
    const title = await getWebElementById("image-container").getTitle();
    jestExpect(title).toBe("Dummy Wallet API App");

    const url = await getWebElementById("param-container").getCurrentUrl();
    jestExpect(url).toBe(
      `http://localhost:${port}/?theme=light&lang=en&name=Dummy+Wallet+API+Live+App`,
    );
  }

  async sendRequest() {
    return await send({
      method: "account.request",
      params: {
        currencyIds: ["ethereum", "bitcoin"],
      },
    });
  }

  async sendAccountReceive() {
    return await send({
      method: "account.receive",
      params: {
        accountId: "2d23ca2a-069e-579f-b13d-05bc706c7583",
      },
    });
  }

  async expectResponse(id: string, response: Promise<Record<string, unknown>>) {
    await jestExpect(response).resolves.toMatchObject({
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
  }

  async stopApp() {
    await stopServer();
  }
}
