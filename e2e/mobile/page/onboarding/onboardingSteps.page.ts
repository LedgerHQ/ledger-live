import { Step } from "jest-allure2-reporter/api";
import { isIos } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";

export default class OnboardingStepsPage {
  private readonly getStartedButton = byId("onboarding-getStarted-button");
  private readonly acceptAnalyticsButton = byId("enabled-accept-analytics-button");
  private readonly setupLedgerButton = byId("onboarding-setupLedger");
  private readonly accessWalletButton = byId("onboarding-accessWallet");
  private readonly scrollListContainer = byId("onboarding-view-scroll-list-container");
  private readonly welcomeProgressBar = (index: number) => byId("welcome-progress-bar", index);
  private readonly deviceCard = (deviceId: string) =>
    byId(`onboarding-device-selection-${deviceId}`);
  private readonly deviceCardPart = (
    deviceId: string,
    part: "header" | "text" | "image" | "title",
  ) => byId(`onboarding-device-selection-${deviceId}-${part}`);

  @Step("Wait for onboarding to load")
  async waitForOnboardingToLoad(): Promise<void> {
    await this.getStartedButton.waitVisible();
  }

  @Step("Expect 3 progress bars to be visible")
  async expectProgressBarToBeVisible(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      await this.welcomeProgressBar(i).expectVisible();
    }
  }

  @Step("Tap on Get Started button")
  async tapOnGetStartedButton(): Promise<void> {
    await this.getStartedButton.tap();
  }

  @Step("Expect the 'Set up your Ledger' option not to be visible")
  async expectSetupLedgerOptionNotVisible(): Promise<void> {
    await this.setupLedgerButton.expectNotVisible();
  }

  @Step("Expect 'Get Started' button to be visible")
  async expectGetStartedButtonToBeVisible(): Promise<void> {
    await this.getStartedButton.expectVisible();
  }

  @Step("Select starting option {{{0}}}")
  async selectStartingOption(option: "setupLedger" | "accessWallet"): Promise<void> {
    switch (option) {
      case "setupLedger":
        await this.setupLedgerButton.tap();
        break;
      case "accessWallet":
        await this.accessWalletButton.tap();
        break;
    }
  }

  @Step("Check device cards")
  async checkDeviceCards(): Promise<void> {
    const devices = [
      { id: "stax", name: "Stax" },
      { id: "europa", name: "Flex" },
      { id: "nanoX", name: "Nano X" },
      { id: "nanoSP", name: "Nano S Plus" },
      { id: "nanoS", name: "Nano S" },
    ];
    for (const device of devices) {
      if (device.id === "nanoS" || device.id === "nanoSP") {
        await this.deviceCard(device.id).scrollTo(this.scrollListContainer, 100);
      }
      await this.deviceCard(device.id).expectVisible();
      await this.deviceCardPart(device.id, "header").expectText("Ledger");
      const title = await this.deviceCardPart(device.id, "title").getText();
      const normalizedTitle = title.replaceAll(/\s+/g, " ").replaceAll("\u200B", "").trim();
      jestExpect(normalizedTitle).toBe(device.name);
      await this.deviceCardPart(device.id, "image").expectVisible();
      if (isIos() && (device.name === "Nano S" || device.name === "Nano S Plus")) {
        await this.deviceCardPart(device.id, "text").expectText("No iPhone compatibility");
      }
    }
  }

  @Step("Wait for analytics button to be visible")
  async waitForAnalyticsButtonToBeVisible(): Promise<void> {
    await this.acceptAnalyticsButton.waitVisible();
  }

  @Step("Accept analytics")
  async acceptAnalytics(): Promise<void> {
    await this.acceptAnalyticsButton.tap();
  }
}
