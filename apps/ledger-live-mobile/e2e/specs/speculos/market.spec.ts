import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { Application } from "../../page";
import { CLI } from "../../utils/cliUtils";

const app = new Application();
const nanoApp = AppInfos.ETHEREUM;
const asset = "Ethereum (ETH)";

describe("Market page for user with no device", () => {
  beforeAll(async () => {
    await app.init({
      speculosApp: nanoApp,
      cliCommands: [
        async () => {
          return CLI.liveData({
            currency: nanoApp.name,
            index: 0,
            appjson: app.userdataPath,
            add: true,
          });
        },
      ],
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-1880");
  it("should find the researched crypto", async () => {
    await app.walletTabNavigator.navigateToMarket();
    await app.market.searchAsset("eth");
    await app.market.expectMarketRowTitle(asset);
  });

  $TmsLink("B2CQA-1879");
  it("should filter starred asset in the list", async () => {
    await app.market.openAssetPage(asset);
    await app.market.starFavoriteCoin();
    await app.market.backToAssetList();
    await app.market.filterStaredAsset();
    await app.market.expectMarketRowTitle(asset);
  });
});
