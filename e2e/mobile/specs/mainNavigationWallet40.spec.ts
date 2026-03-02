$TmsLink("B2CQA-4383");
$TmsLink("B2CQA-4385");
const tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];
tags.forEach(tag => $Tag(tag));

describe("Main Navigation", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      featureFlags: {
        lwmWallet40: {
          enabled: true,
          params: {
            mainNavigation: true,
            marketBanner: true,
            graphRework: true,
            quickActionCtas: true,
          },
        },
      },
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  it("should show Portfolio with Wallet 4.0 navigation layout", async () => {
    await app.mainNavigation.expectPortfolioPageVisible();
    await app.mainNavigation.expectWallet40BottomTabsVisible();
    await app.mainNavigation.expectWallet40TopBarVisible();
    await app.mainNavigation.expectLegacyTabsNotVisible();
  });

  it("should navigate to Swap via bottom tab", async () => {
    await app.mainNavigation.tapWallet40Tab("swap");
    await app.mainNavigation.expectWallet40BottomTabsVisible();
  });

  it("should navigate to Earn via bottom tab and show Earn page", async () => {
    await app.mainNavigation.tapWallet40Tab("earn");
    await app.mainNavigation.expectEarnPageVisible();
    await app.mainNavigation.expectWallet40BottomTabsVisible();
  });

  it("should navigate to Card via bottom tab and show Card page", async () => {
    await app.mainNavigation.tapWallet40Tab("card");
    await app.mainNavigation.expectCardPageVisible();
    await app.mainNavigation.expectWallet40BottomTabsVisible();
  });

  it("should navigate back to Portfolio via Home tab", async () => {
    await app.mainNavigation.tapWallet40Tab("home");
    await app.mainNavigation.expectPortfolioPageVisible();
    await app.mainNavigation.expectWallet40BottomTabsVisible();
    await app.mainNavigation.expectWallet40TopBarVisible();
  });

  it("should navigate to Discover via top bar and show Web3Hub page", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarDiscover();
    await app.mainNavigation.expectDiscoverPageVisible();
  });

  it("should navigate to My Ledger via top bar and show Manager page", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarMyLedger();
    await app.mainNavigation.expectMyLedgerPageVisible();
    await app.mainNavigation.tapHeaderBackButton();
  });

  it("should navigate to Notifications via top bar and show Notifications page", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarNotifications();
    await app.mainNavigation.expectNotificationsPageVisible();
  });

  it("should navigate to Settings via top bar and show Settings page", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarSettings();
    await app.mainNavigation.expectSettingsPageVisible();
  });
});
