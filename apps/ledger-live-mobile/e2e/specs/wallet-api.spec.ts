import { by, device, web } from "detox"; // this is because we need to use both the jest expect and the detox.expect version, which has some different assertions
import { loadConfig } from "../bridge/server";
import { isAndroid } from "../helpers";
import PortfolioPage from "../models/wallet/portfolioPage";
import DiscoverPage from "../models/discover/discoverPage";
import LiveAppWebview from "../models/liveApps/liveAppWebview";
import CryptoDrawer from "../models/liveApps/cryptoDrawer";
import { stopDummyServer } from "@ledgerhq/test-utils";

let portfolioPage: PortfolioPage;
let discoverPage: DiscoverPage;
let liveAppWebview: LiveAppWebview;
let cryptoDrawer: CryptoDrawer;

let continueTest: boolean;

describe("Wallet API methods", () => {
  beforeAll(async () => {
    portfolioPage = new PortfolioPage();
    discoverPage = new DiscoverPage();
    liveAppWebview = new LiveAppWebview();
    cryptoDrawer = new CryptoDrawer();

    await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
    // Check that dummy app in tests/utils/dummy-app-build has been started successfully

    continueTest = await liveAppWebview.startLiveApp("dummy-wallet-app", 52619);

    if (!continueTest || !isAndroid()) {
      console.warn("Stopping Wallet API test setup");
      return; // need to make this a proper ignore/jest warning
    }

    loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);

    // start navigation
    await portfolioPage.waitForPortfolioPageToLoad();
    await discoverPage.openViaDeeplink("dummy-live-app");

    const title = await web.element(by.web.id("image-container")).getTitle();
    expect(title).toBe("Dummy Wallet API App");

    const url = await web.element(by.web.id("param-container")).getCurrentUrl();
    expect(url).toBe("http://localhost:52619/?theme=light&lang=en&name=Dummy+Wallet+API+Live+App");
  });

  afterAll(async () => {
    await stopDummyServer();
  });

  it("account.request", async () => {
    if (!continueTest || !isAndroid()) {
      console.warn("Stopping Wallet API test");
      return; // need to make this a proper ignore/jest warning
    }

    const { id, response } = await liveAppWebview.send({
      method: "account.request",
      params: {
        currencyIds: ["ethereum", "bitcoin"],
      },
    });

    await cryptoDrawer.selectCurrencyFromDrawer("Bitcoin");
    await cryptoDrawer.selectAccountFromDrawer("Bitcoin 1 (legacy)");

    await expect(response).resolves.toMatchObject({
      jsonrpc: "2.0",
      id,
      result: {
        rawAccount: {
          id: "2d23ca2a-069e-579f-b13d-05bc706c7583",
          address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
          balance: "35688397",
          blockHeight: 194870,
          currency: "bitcoin",
          // lastSyncDate: "2020-03-14T13:34:42.000Z",
          name: "Bitcoin 1 (legacy)",
          spendableBalance: "35688397",
        },
      },
    });
  });
});
