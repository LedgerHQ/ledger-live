import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "helpers/allure/allure-helper";
import { FF_LWM_WALLET_40_Q2 } from "utils/featureFlagUtils";

const TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

// TODO: temporary override until LIVE-29336 is done
const FF_WALLET_ASSETS = {
  lwmWallet40: {
    ...FF_LWM_WALLET_40_Q2.lwmWallet40,
    params: {
      ...FF_LWM_WALLET_40_Q2.lwmWallet40.params,
      aggregatedAssets: false,
    },
  },
};

setTeamOwner(Team.WALLET_XP);
describe("Wallet assets", () => {
  const tmsLinks = ["B2CQA-4839", "B2CQA-4840"];
  const currency = Account.INJ_1.currency;

  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      speculosApp: currency.speculosApp,
      featureFlags: FF_WALLET_ASSETS,
    });
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible(10_000);
    await app.mainNavigation.waitForWallet40Ready();
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible();
  });

  tmsLinks.forEach(link => $TmsLink(link));
  TAGS.forEach(tag => $Tag(tag));

  it(`[${currency.testLabel}] - Wallet assets empty state shows placeholders and add account CTA`, async () => {
    await app.portfolio.checkCryptosListSectionVisible(true);
    await app.portfolio.checkStablecoinsListSectionVisible(true);
    await app.portfolio.checkTotalAssetItemCount(6);
    await app.portfolio.checkAddAccountCtaVisible();
  });

  it(`[${currency.testLabel}] - Selecting an asset redirects to its market page`, async () => {
    await app.portfolio.tapFirstAssetItemW40();
    await app.market.expectAssetPageVisible();
    await app.market.leaveAssetPage();
    await app.mainNavigation.waitForWallet40Ready();
  });
});

setTeamOwner(Team.WALLET_XP);
describe("Wallet assets", () => {
  const tmsLinks = ["B2CQA-4841"];

  beforeAll(async () => {
    await app.init({
      userdata: "wallet40-btc-only",
      featureFlags: FF_WALLET_ASSETS,
    });
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible(10_000);
    await app.mainNavigation.waitForWallet40Ready();
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible();
  });

  tmsLinks.forEach(link => $TmsLink(link));
  TAGS.forEach(tag => $Tag(tag));

  it(`[${Currency.BTC.testLabel}] - Wallet assets section with fewer than 6 cryptos and stablecoins`, async () => {
    await app.portfolio.checkCryptosListSectionVisible();
    await app.portfolio.checkStablecoinsListSectionVisible();
    await app.portfolio.checkTotalAssetItemCount(6);
    await app.portfolio.checkAssetVisible("Bitcoin");
  });
});

setTeamOwner(Team.WALLET_XP);
describe("Wallet assets", () => {
  const tmsLinks = ["B2CQA-4834", "B2CQA-4837", "B2CQA-4838"];

  beforeAll(async () => {
    await app.init({
      userdata: "wallet40-many-stablecoins",
      featureFlags: FF_WALLET_ASSETS,
    });
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible(10_000);
    await app.mainNavigation.waitForWallet40Ready();
    await app.wallet40Drawers.closeWallet40BlockingDrawersIfVisible();
  });

  tmsLinks.forEach(link => $TmsLink(link));
  TAGS.forEach(tag => $Tag(tag));

  it("Wallet assets section caps cryptos at 6", async () => {
    await app.portfolio.scrollToTopOfPortfolioPage();
    await app.portfolio.checkCryptosListSectionVisible();
    await app.portfolio.checkCryptosSectionAssetItemCount(6);
    await app.portfolio.checkAssetVisible("Ethereum");
    await app.portfolio.checkAssetVisible("Bitcoin");
    await app.portfolio.tapCryptosSectionTitle();
    await app.portfolio.checkCryptoListPageVisible();
    await app.common.goToPreviousPage();
    await app.mainNavigation.waitForWallet40Ready();
  });

  it("Wallet assets section caps stablecoins at 6", async () => {
    await app.portfolio.scrollToTopOfPortfolioPage();
    await app.portfolio.checkStablecoinsListSectionVisible();
    await app.portfolio.checkAssetVisible("Tether USD");
    await app.portfolio.checkAssetVisible("USD Coin");
    await app.portfolio.tapStablecoinsSectionTitle();
    await app.portfolio.checkStablecoinListPageVisible();
    await app.common.goToPreviousPage();
    await app.mainNavigation.waitForWallet40Ready();
  });
});
