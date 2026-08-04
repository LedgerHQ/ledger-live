import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "helpers/allure/allure-helper";
import { FF_LWM_WALLET_40_Q2 } from "utils/featureFlagUtils";

setTeamOwner(Team.WALLET_XP);
$TmsLink("B2CQA-4383");
$TmsLink("B2CQA-4385");
const tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];
tags.forEach(tag => $Tag(tag));

describe("Main navigation", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      featureFlags: FF_LWM_WALLET_40_Q2,
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  it("Portfolio uses the Wallet 4.0 Q2 navigation layout", async () => {
    await app.mainNavigation.expectPortfolioPageVisible();
    await app.mainNavigation.expectWallet40BottomTabsVisible();
    await app.mainNavigation.expectWallet40TopBarVisible();
    await app.mainNavigation.expectLegacyTabsNotVisible();
  });

  setTeamOwner(Team.SWAP);
  it("Navigate to swap via the bottom tab", async () => {
    await app.mainNavigation.tapWallet40Tab("swap");
    await app.mainNavigation.expectWallet40BottomTabsVisible();
  });

  it("Navigate to earn via the bottom tab", async () => {
    await app.mainNavigation.tapWallet40Tab("earn");
    await app.mainNavigation.expectEarnPageVisible();
    await app.mainNavigation.expectWallet40BottomTabsVisible();
  });

  it("Navigate to card via the bottom tab", async () => {
    await app.mainNavigation.tapWallet40Tab("card");
    await app.mainNavigation.expectCardPageVisible();
    await app.mainNavigation.expectWallet40BottomTabsVisible();
  });

  it("Navigate back to portfolio via the home tab", async () => {
    await app.mainNavigation.tapWallet40Tab("home");
    await app.mainNavigation.expectPortfolioPageVisible();
    await app.mainNavigation.expectWallet40BottomTabsVisible();
    await app.mainNavigation.expectWallet40TopBarVisible();
  });

  it("Navigate to discover via the top bar", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarDiscover();
    await app.mainNavigation.expectDiscoverPageVisible();
  });

  it("Open My Wallet via the top bar avatar", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarMyWallet();
    await app.myWallet.expectScreenVisible();
    await app.myWallet.tapHeaderBack();
  });

  it("Navigate to notifications from My Wallet", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarMyWallet();
    await app.myWallet.tapHeaderNotifications();
    await app.mainNavigation.expectNotificationsPageVisible();
  });

  it("Navigate to settings from My Wallet", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarMyWallet();
    await app.myWallet.tapHeaderSettings();
    await app.myWallet.expectSettingsScreenVisible();
  });
});
