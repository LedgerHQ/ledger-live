const ACCOUNT = Account.ETH_1;
const CURRENCY = ACCOUNT.currency;

$TmsLink("B2CQA-4383");
$TmsLink("B2CQA-4385");
const tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];
tags.forEach(tag => $Tag(tag));

describe("Legacy Main Navigation", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      speculosApp: CURRENCY.speculosApp,
      featureFlags: {
        lwmWallet40: {
          enabled: false,
        },
      },
    });
    await app.mainNavigation.waitForLegacyReady();
  });

  it("should show Portfolio with legacy navigation layout", async () => {
    await app.mainNavigation.expectPortfolioPageVisible();
    await app.mainNavigation.expectLegacyBottomTabsVisible();
    await app.mainNavigation.expectWallet40TopBarNotVisible();
  });

  it("should navigate to Earn via legacy tab and show Earn page", async () => {
    await app.mainNavigation.tapLegacyEarnTab();
    await app.mainNavigation.expectEarnPageVisible();
    await app.mainNavigation.expectLegacyBottomTabsVisible();
  });

  it("should navigate to Discover via legacy tab and show Discover page", async () => {
    await app.mainNavigation.tapLegacyDiscoverTab();
    await app.mainNavigation.expectDiscoverPageVisible();
    await app.mainNavigation.expectLegacyBottomTabsVisible();
  });

  it("should navigate to My Ledger via legacy tab and show Manager page", async () => {
    await app.mainNavigation.tapLegacyMyLedgerTab();
    await app.mainNavigation.expectMyLedgerPageVisible();
    await app.mainNavigation.expectLegacyBottomTabsVisible();
  });

  it("should navigate back to Portfolio via legacy tab", async () => {
    await app.mainNavigation.tapLegacyPortfolioTab();
    await app.mainNavigation.expectPortfolioPageVisible();
    await app.mainNavigation.expectLegacyBottomTabsVisible();
  });
});
