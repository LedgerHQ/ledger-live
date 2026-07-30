import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../helpers/allure/allure-helper";

const tags: string[] = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@ethereum",
  "@family-evm",
];
describe("Market", () => {
  const nanoApp = AppInfos.ETHEREUM;
  const currency = Currency.ETH;

  beforeAll(async () => {
    await app.init({
      speculosApp: nanoApp,
      cliCommands: [liveDataCommand(Account.ETH_1)],
      speculosForSetupOnly: true,
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  setTeamOwner(Team.WALLET_XP);
  $TmsLink("B2CQA-1879");
  tags.forEach(tag => $Tag(tag));
  it("Market filters behavior", async () => {
    await app.portfolio.tapMarketBannerTitle();
    await app.market.searchAsset(currency.ticker);
    await app.market.expectMarketRowTitle(currency);
    await app.market.openAssetPage(currency);
    await app.market.starFavoriteCoin();
    await app.market.backToAssetList();
    await app.market.filterStaredAsset();
    await app.market.expectMarketRowTitle(currency);
  });
});
