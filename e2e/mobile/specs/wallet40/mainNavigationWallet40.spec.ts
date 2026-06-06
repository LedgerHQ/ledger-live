import { WALLET_40_FEATURE_FLAGS } from "../../utils/constants";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

setTeamOwner(Team.WALLET_XP);
$TmsLink("B2CQA-4383");
$TmsLink("B2CQA-4385");
const tags: string[] = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];
tags.forEach(tag => $Tag(tag));

describe("Wallet 4.0 - Main Navigation", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      featureFlags: WALLET_40_FEATURE_FLAGS,
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  it("should show Portfolio with Wallet 4.0 navigation layout", async () => {
    await app.mainNavigation.expectPortfolioPageVisible();
    await app.mainNavigation.expectWallet40BottomTabsVisible();
    await app.mainNavigation.expectWallet40TopBarVisible();
    await app.mainNavigation.expectLegacyTabsNotVisible();
  });

  setTeamOwner(Team.SWAP);
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

  it("should open My Wallet via top bar avatar", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarMyWallet();
    await app.myWallet.expectScreenVisible();
    await app.myWallet.tapHeaderBack();
  });

  it("should navigate to Notifications from My Wallet", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarMyWallet();
    await app.myWallet.tapHeaderNotifications();
    await app.mainNavigation.expectNotificationsPageVisible();
  });

  it("should navigate to Settings from My Wallet", async () => {
    await app.mainNavigation.openPortfolioViaDeeplink();
    await app.mainNavigation.tapTopBarMyWallet();
    await app.myWallet.tapHeaderSettings();
    await app.myWallet.expectSettingsScreenVisible();
  });
});
