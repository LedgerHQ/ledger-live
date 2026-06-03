import { WALLET_40_FEATURE_FLAGS } from "../../utils/constants";

const testConfig = {
  tmsLinks: ["B2CQA-5405", "B2CQA-5426", "B2CQA-5427"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

describe("Wallet 4.0 - MyWallet", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "speculos-x-other-account",
      featureFlags: WALLET_40_FEATURE_FLAGS,
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  beforeEach(async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
  });

  testConfig.tmsLinks.forEach(link => $TmsLink(link));
  testConfig.tags.forEach(tag => $Tag(tag));

  it("should open My Wallet from Portfolio and from Earn", async () => {
    await app.mainNavigation.expectPortfolioPageVisible();
    await app.myWallet.openFromTopBar();
    await app.myWallet.tapHeaderBack();

    await app.mainNavigation.expectPortfolioPageVisible();

    await app.mainNavigation.tapWallet40Tab("earn");
    await app.mainNavigation.expectEarnPageVisible();
    await app.myWallet.openFromTopBar();
  });

  it("should access Help from My Wallet", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.myWallet.openFromTopBar();
    await app.myWallet.tapHelp();
    await app.myWallet.expectHelpScreenVisible();
  });

  it("should access Settings from My Wallet", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.myWallet.openFromTopBar();
    await app.myWallet.tapHeaderSettings();
    await app.myWallet.expectSettingsScreenVisible();
  });
});
