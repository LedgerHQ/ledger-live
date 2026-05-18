import pages from "../pages/pages.ts";

describe("Onboarding", () => {
  it("Displays the Get Started button", async () => {
    await pages.onboarding.expectGetStartedButtonToBeDisplayed();
  });
});
