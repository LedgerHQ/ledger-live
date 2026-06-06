import { WALLET_40_FEATURE_FLAGS } from "../../utils/constants";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

const TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

setTeamOwner(Team.WALLET_XP);
describe("Wallet 4.0 - Portfolio-Asset/Address - Onboard without accounts", () => {
  const tmsLinks = ["B2CQA-4839", "B2CQA-4840"];
  const currency = Account.INJ_1.currency;

  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      speculosApp: currency.speculosApp,
      featureFlags: WALLET_40_FEATURE_FLAGS,
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  tmsLinks.forEach(link => $TmsLink(link));
  TAGS.forEach(tag => $Tag(tag));

  it("should display 4 cryptos, 2 stablecoins and an Add account CTA", async () => {
    await app.portfolio.checkCryptosListSectionVisible(true);
    await app.portfolio.checkStablecoinsListSectionVisible(true);
    await app.portfolio.checkTotalAssetItemCount(6);
    await app.portfolio.checkAddAccountCtaVisible();
  });

  it("should redirect to the correct asset market page when selecting an asset", async () => {
    await app.portfolio.tapFirstAssetItemW40();
    await app.market.expectMarketDetailPage();
    await app.market.leaveMarketDetailPage();
    await app.portfolio.waitForPortfolioPageToLoad();
  });
});

setTeamOwner(Team.WALLET_XP);
describe("Wallet 4.0 - Portfolio-Asset/Address - With fewer accounts than section minimum (padding)", () => {
  const tmsLinks = ["B2CQA-4841"];

  beforeAll(async () => {
    await app.init({
      userdata: "wallet40-btc-only",
      featureFlags: WALLET_40_FEATURE_FLAGS,
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  tmsLinks.forEach(link => $TmsLink(link));
  TAGS.forEach(tag => $Tag(tag));

  it("should pad cryptos to 4 and stablecoins to 2 with default assets when user has fewer accounts than minimum", async () => {
    await app.portfolio.checkCryptosListSectionVisible();
    await app.portfolio.checkStablecoinsListSectionVisible();
    await app.portfolio.checkTotalAssetItemCount(6);
    await app.portfolio.checkAssetVisible("Bitcoin");
  });
});

setTeamOwner(Team.WALLET_XP);
describe("Wallet 4.0 - Portfolio-Asset/Address - Open the app with accounts", () => {
  const tmsLinks = ["B2CQA-4834", "B2CQA-4837", "B2CQA-4838"];

  beforeAll(async () => {
    await app.init({
      userdata: "wallet40-many-stablecoins",
      featureFlags: WALLET_40_FEATURE_FLAGS,
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  tmsLinks.forEach(link => $TmsLink(link));
  TAGS.forEach(tag => $Tag(tag));

  it("should cap cryptos at 6, show only cryptos when clicking section title, and list all 6 crypto assets", async () => {
    await app.portfolio.scrollToTopOfPortfolioPage();
    await app.portfolio.checkCryptosListSectionVisible();
    await app.portfolio.checkTotalAssetItemCount(12);
    await app.portfolio.checkAssetVisible("Ethereum");
    await app.portfolio.checkAssetVisible("Bitcoin");
    await app.portfolio.tapCryptosSectionTitle();
    await app.portfolio.checkCryptoListPageVisible();
    await app.common.goToPreviousPage();
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("should cap stablecoins at 6, show only stablecoins when clicking section title, and list all stablecoin assets", async () => {
    await app.portfolio.checkStablecoinsListSectionVisible();
    await app.portfolio.checkAssetVisible("Tether USD");
    await app.portfolio.checkAssetVisible("USD Coin");
    await app.portfolio.tapStablecoinsSectionTitle();
    await app.portfolio.checkStablecoinListPageVisible();
    await app.common.goToPreviousPage();
    await app.portfolio.waitForPortfolioPageToLoad();
  });
});
