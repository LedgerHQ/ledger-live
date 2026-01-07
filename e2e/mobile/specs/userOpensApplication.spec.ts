const testConfig = {
  tmsLinks: ["B2CQA-734"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

describe("User opens application", () => {
  testConfig.tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  testConfig.tags.forEach(tag => $Tag(tag));
  test("Verify that user can open application", async () => {
    await app.onboarding.waitForOnboardingToLoad();
    await app.onboarding.expectGetStartedButtonToBeVisible();
    await app.onboarding.expectCurrentSelectedLanguageToBe("EN");
    await app.onboarding.selectLanguage("FR");
    await app.onboarding.expectCurrentSelectedLanguageToBe("FR");
    await app.onboarding.selectLanguage("EN");

    await app.onboarding.tapOnGetStartedButton();

    await app.onboarding.selectStartingOption("setupLedger");
    await app.onboarding.checkDeviceCards();
  });
});
