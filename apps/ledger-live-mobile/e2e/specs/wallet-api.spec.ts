import { loadConfig, loadLocalManifest } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import { delay } from "../helpers";
import * as server from "../../../ledger-live-desktop/tests/utils/serve-dummy-app";
import { setEnv } from "@ledgerhq/live-common/env";

let portfolioPage: PortfolioPage;

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
      setEnv(
        "MOCK_REMOTE_LIVE_MANIFEST",
        JSON.stringify(
          server.liveAppManifest({
            id: "dummy-live-app",
            url,
            name: "Dummy Wallet API Live App",
            apiVersion: "2.0.0",
            content: {
              shortDescription: {
                en: "App to test the Wallet API",
              },
              description: {
                en: "App to test the Wallet API with Playwright",
              },
            },
          }),
        ),
      );
      // } else {
      //   throw new Error("Ping response != 200, got: " + response.status);
      // }
    } catch (error) {
      console.warn(`========> Dummy test app not running! <=========`);
      console.error(error);
    }

    //start navigation

    portfolioPage = new PortfolioPage();

    loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);
    // loadLocalManifest();
  });

  it("should load the Swap page from the Transfer menu", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
    await delay(100000000);
  });
});
