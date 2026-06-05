import pages from "../pages/pages.ts";

describe("Onboarding", () => {
  it("displays the Get Started button", async () => {
    await pages.onboarding.expectGetStartedButtonToBeDisplayed();
  });
});
