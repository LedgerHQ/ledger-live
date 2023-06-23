import { loadConfig, loadLocalManifest } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import { delay } from "../helpers";
import * as server from "../../../ledger-live-desktop/tests/utils/serve-dummy-app";
import discoveryPage from "../models/discovery/discoveryPage";
import DiscoveryPage from "../models/discovery/discoveryPage";

let portfolioPage: PortfolioPage;
let discoverPage: DiscoveryPage;

describe("Swap", () => {
  // let continueTest = false;

  // {
  //   "id": "multibuy",
  //   "name": "Buy / Sell Preview App",
  //   "url": "https://buy-sell-live-app.vercel.app",
  //   "homepageUrl": "https://buy-sell-live-app.vercel.app",
  //   "icon": "",
  //   "platform": "all",
  //   "apiVersion": "0.0.1",
  //   "manifestVersion": "1",
  //   "branch": "stable",
  //   "categories": ["exchange", "buy"],
  //   "currencies": ["ethereum", "bitcoin"],
  //   "content": {
  //     "shortDescription": {
  //       "en": "Preview app for Buy/Sell"
  //     },
  //     "description": {
  //       "en": "Preview app for Buy/Sell"
  //     }
  //   },
  //   "permissions": [
  //     {
  //       "method": "account.request",
  //       "params": {
  //         "currencies": ["ethereum", "bitcoin"]
  //       }
  //     }
  //   ],
  //   "domains": ["https://*"]
  // }

  beforeAll(async () => {
    // Check that dummy app in tests/utils/dummy-app-build has been started successfully
    try {
      const port = await server.start(
        "../../../ledger-live-desktop/tests/utils/dummy-wallet-app/build",
      );
      const url = `http://localhost:${port}`;
      // const response = await fetch(url);
      // if (true)) {
      // continueTest = true;
      // console.info(
      // `========> Dummy Wallet API app successfully running on port ${port}! <=========`,
      // );
      // JSON
      // } else {
      //   throw new Error("Ping response != 200, got: " + response.status);
      // }
    } catch (error) {
      console.warn(`========> Dummy test app not running! <=========`);
      console.error(error);
    }

    //start navigation

    portfolioPage = new PortfolioPage();
    discoverPage = new DiscoveryPage();

    loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);
    // loadLocalManifest();
  });

  it("should load LLM", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("should navigate to discover", async () => {
    await portfolioPage.navigateToDiscoverTab();
  });

  it("should navigate to dummy app", async () => {
    // await discoverPage.navigateToLiveApp("dummy-live-app");
    await discoverPage.navigateToLiveApp("ramp");
    await delay(100000000);
  });
});
