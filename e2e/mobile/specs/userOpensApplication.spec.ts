import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { PartialFeatures } from "@shared/feature-flags";

const testConfig = {
  tmsLinks: ["B2CQA-734"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

// Android skips it because Detox grants POST_NOTIFICATIONS at install.
// We disable it to avoid the opt-in screen on iOS.
const FF_DISABLE_NOTIFICATIONS_OPT_IN: PartialFeatures = {
  lwmNotificationsOptIn: { enabled: false },
};

setTeamOwner(Team.WALLET_XP);
describe("Settings", () => {
  testConfig.tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  testConfig.tags.forEach(tag => $Tag(tag));

  beforeAll(async () => {
    await app.init({ userdata: null, featureFlags: FF_DISABLE_NOTIFICATIONS_OPT_IN });
  });

  test("Open the application", async () => {
    await app.onboarding.waitForOnboardingToLoad();
    await app.onboarding.expectGetStartedButtonToBeVisible();
    await app.onboarding.expectProgressBarToBeVisible();
    await app.onboarding.tapOnGetStartedButton();

    await app.onboarding.waitForAnalyticsButtonToBeVisible();
    await app.onboarding.acceptAnalytics();
    await app.portfolio.tapConnectButton();
    await app.onboarding.selectStartingOption("setupLedger");

    await app.onboarding.checkDeviceCards();
  });
});
