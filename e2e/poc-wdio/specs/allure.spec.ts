import pages from "../pages/pages.ts";
import allureReporter from "@wdio/allure-reporter";

describe("Allure reporting", () => {
  it("should display custom tags", async () => {
    await allureReporter.addTag("custom-tag-1");
  });

  it("should display custom issues", async () => {
    await allureReporter.addIssue("QAA-1214");
  });

  it("should display custom links", async () => {
    await allureReporter.addLink("QAA-1214");
  });

  it("should display custom test id", async () => {
    await allureReporter.addTestId("QAA-1214");
  });

  it("should display custom steps", async () => {
    allureReporter.step("my first step", async s1 => {
      await pages.onboarding.expectGetStartedButtonToBeDisplayed();
      await driver.takeScreenshot();
    });

    allureReporter.step("my second step", async s1 => {
      await pages.onboarding.getStartedButton.click();
    });
  });

  it("should display custom description", async () => {
    await allureReporter.addDescription(
      "my first line of description\nmy second line of description",
    );
  });

  it("should display a custom suite", async () => {
    await allureReporter.addSuite("Custom suite");
  });

  it("should display a custom owner", async () => {
    await allureReporter.addOwner("EARN");
  });

  it("should display a custom severity", async () => {
    await allureReporter.addSeverity("critical");
  });
});
