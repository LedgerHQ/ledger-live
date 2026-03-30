import { setFeatureFlags } from "../bridge/server";

const testConfig = {
  tmsLinks: ["B2CQA-734"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

describe("User opens application", () => {
  testConfig.tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  testConfig.tags.forEach(tag => $Tag(tag));
  beforeAll(async () => {
    await setFeatureFlags({
      llmAnalyticsOptInPrompt: {
        enabled: true,
        params: {
          variant: "A",
          entryPoints: ["Onboarding", "Portfolio"],
        },
      },
    });
  });

  test("Verify that user can open application", async () => {
    await app.onboarding.waitForOnboardingToLoad();
    await app.onboarding.expectGetStartedButtonToBeVisible();
    await app.onboarding.expectProgressBarToBeVisible();
    await app.onboarding.tapOnGetStartedButton();

    await app.onboarding.acceptAnalytics();
    await app.onboarding.selectStartingOption("setupLedger");

    await app.onboarding.checkDeviceCards();
  });
});
