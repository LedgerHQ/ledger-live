import { WALLET_40_FEATURE_FLAGS } from "../../utils/constants";

// to-do remove llmAccountListUI when wallet 4.0 is default
const FEATURE_FLAGS = {
  ...WALLET_40_FEATURE_FLAGS,
  llmAccountListUI: {
    enabled: true,
  },
};

const TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

describe("Wallet 4.0 - Portfolio-Asset/Address - Onboard without accounts", () => {
  const tmsLinks = ["B2CQA-4839", "B2CQA-4840"];
  const currency = Account.INJ_1.currency;

  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      speculosApp: currency.speculosApp,
      featureFlags: FEATURE_FLAGS,
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  tmsLinks.forEach(link => $TmsLink(link));
  TAGS.forEach(tag => $Tag(tag));

  it("should display 4 cryptos, 2 stablecoins and an Add account CTA", async () => {
    await app.portfolio.checkCryptosListSectionVisible();
    await app.portfolio.checkStablecoinsListSectionVisible();
    await app.portfolio.checkTotalAssetItemCount(6);
    await app.portfolio.checkAddAccountCtaVisible();
  });

  it("should redirect to the asset market page when selecting an asset", async () => {
    await app.portfolio.tapFirstAssetItemW40();
    await app.market.expectMarketDetailPage();
    await app.market.leaveMarketDetailPage();
    await app.portfolio.waitForPortfolioPageToLoad();
  });
});

describe("Wallet 4.0 - Portfolio-Asset/Address - With one account", () => {
  const tmsLinks = ["B2CQA-4841"];

  beforeAll(async () => {
    await app.init({
      userdata: "speculos-tests-app",
      featureFlags: FEATURE_FLAGS,
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  tmsLinks.forEach(link => $TmsLink(link));
  TAGS.forEach(tag => $Tag(tag));

  it("should display cryptos and stablecoins sections when user has accounts", async () => {
    await app.portfolio.checkCryptosListSectionVisible();
    await app.portfolio.checkStablecoinsListSectionVisible();
  });
});

describe("Wallet 4.0 - Portfolio-Asset/Address - Open the app with accounts", () => {
  const tmsLinks = ["B2CQA-4834", "B2CQA-4837", "B2CQA-4838"];

  beforeAll(async () => {
    await app.init({
      userdata: "wallet40-many-stablecoins",
      // aggregatedAssets: false shows individual assets per network instead of aggregated,
      // which is needed to have >6 items per section and verify the cap.
      featureFlags: {
        ...FEATURE_FLAGS,
        lwmWallet40: {
          ...WALLET_40_FEATURE_FLAGS.lwmWallet40,
          params: {
            ...WALLET_40_FEATURE_FLAGS.lwmWallet40.params,
            aggregatedAssets: false,
          },
        },
      },
    });
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  tmsLinks.forEach(link => $TmsLink(link));
  TAGS.forEach(tag => $Tag(tag));

  it("should cap cryptos at 6 and stablecoins at 6 when there are more than 6 of each", async () => {
    await app.portfolio.checkCryptosListSectionVisible();
    await app.portfolio.checkStablecoinsListSectionVisible();
    await app.portfolio.checkTotalAssetItemCount(12);
  });

  it("should display only cryptos when clicking the cryptos section title", async () => {
    await app.portfolio.tapCryptosSectionTitle();
    await app.portfolio.checkCryptoListPageVisible();
    await app.common.goToPreviousPage();
    await app.portfolio.waitForPortfolioPageToLoad();
  });

  it("should display only stablecoins when clicking the stablecoins section title", async () => {
    await app.portfolio.checkStablecoinsListSectionVisible();
    await app.portfolio.tapStablecoinsSectionTitle();
    await app.portfolio.checkStablecoinListPageVisible();
    await app.common.goToPreviousPage();
    await app.portfolio.waitForPortfolioPageToLoad();
  });
});
