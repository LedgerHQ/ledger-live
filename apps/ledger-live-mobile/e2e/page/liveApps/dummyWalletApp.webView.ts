import { startLiveApp, stopServer } from "../../models/liveApps";
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

  async clearStates() {
    await getWebElementByTestId("clear-states").tap();
  }

  async sendRequest() {
    await typeTextByWebTestId("currency-ids-input", "ethereum,bitcoin");
    await tapWebElementByTestId("account-request");
  }

  async sendAccountReceive() {
    await typeTextByWebTestId("account-id-input", "2d23ca2a-069e-579f-b13d-05bc706c7583");
    await tapWebElementByTestId("account-receive");
  }

  async getResOutput() {
    const res = await getWebElementText("res-output");
    return JSON.parse(res);
  }

  async stopApp() {
    await stopServer();
  }
}
