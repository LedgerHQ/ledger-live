import { Step } from "jest-allure2-reporter/api";
import { isIos } from "../../helpers/commonHelpers";

export default class OnboardingStepsPage {
  getStartedButtonId = "onboarding-getStarted-button";
  acceptAnalyticsButtonId = "enabled-accept-analytics-button";
  recoveryPhrase = "onboarding-useCase-recoveryPhrase";
  setupLedger = "onboarding-setupLedger";
  accessWallet = "onboarding-accessWallet";
  currentSelectedLanguageId = "current-selected-language";
  languageSelectButtonId = "language-select-button";
  languageSelectDrawerTitleId = "language-select-drawer-title";
  deviceCardBaseId = "onboarding-device-selection";
  scrollListContainerId = "onboarding-view-scroll-list-container";
  welcomeProgressBarId = "welcome-progress-bar";

  languageSelectElementId = (language: string) => `language-select-${language}`;
  deviceCardId = (title: string) => `${this.deviceCardBaseId}-${title}`;
  deviceCardTitleId = (title: string) => `${this.deviceCardId(title)}-title`;

  onboardingGetStartedButton = () => getElementById(this.getStartedButtonId);
  acceptAnalyticsButton = () => getElementById(this.acceptAnalyticsButtonId);
  setupLedgerButton = () => getElementById(this.setupLedger);
  accessWalletButton = () => getElementById(this.accessWallet);
  deviceCardHeader = (title: string) => getElementById(`${this.deviceCardId(title)}-header`);
  deviceCardText = (title: string) => getElementById(`${this.deviceCardId(title)}-text`);
  deviceCardImage = (title: string) => getElementById(`${this.deviceCardId(title)}-image`);

  @Step("Wait for onboarding to load")
  async waitForOnboardingToLoad(): Promise<void> {
    await waitForElementById(this.getStartedButtonId);
  }

  @Step("Expect 3 progress bars to be visible")
  async expectProgressBarToBeVisible(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      await detoxExpect(getElementById(this.welcomeProgressBarId, i)).toBeVisible();
    }
  }

  @Step("Tap on Get Started button")
  async tapOnGetStartedButton(): Promise<void> {
    await tapById(this.getStartedButtonId);
  }

  @Step("Expect 'Get Started' button to be visible")
  async expectGetStartedButtonToBeVisible(): Promise<void> {
    await detoxExpect(this.onboardingGetStartedButton()).toBeVisible();
  }

  @Step("Expect current selected language")
  async expectCurrentSelectedLanguageToBe(language: string): Promise<void> {
    const text = await getTextOfElement(this.currentSelectedLanguageId);
    jestExpect(text).toContain(language);
  }

  @Step("Select language")
  async selectLanguage(language: string): Promise<void> {
    await tapById(this.languageSelectButtonId);
    await waitForElementById(this.languageSelectDrawerTitleId);
    await tapById(this.languageSelectElementId(language.toLowerCase()));
  }

  @Step("Select starting option")
  async selectStartingOption(option: "setupLedger" | "accessWallet"): Promise<void> {
    switch (option) {
      case "setupLedger":
        await tapByElement(this.setupLedgerButton());
        break;
      case "accessWallet":
        await tapByElement(this.accessWalletButton());
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
        await scrollToId(this.deviceCardId(device.id), this.scrollListContainerId, 100, "down");
      }
      await detoxExpect(getElementById(this.deviceCardId(device.id))).toBeVisible();
      await detoxExpect(this.deviceCardHeader(device.id)).toHaveText("Ledger");
      const titleId = await getTextOfElement(this.deviceCardTitleId(device.id));
      const normalizedTitle = titleId
        .replace(/\s+/g, " ")
        .replace(/\u200B/g, "")
        .trim();
      jestExpect(normalizedTitle).toBe(device.name);
      await detoxExpect(this.deviceCardImage(device.id)).toBeVisible();
      if (isIos() && (device.name === "Nano S" || device.name === "Nano S Plus")) {
        await detoxExpect(this.deviceCardText(device.id)).toHaveText("No iPhone compatibility");
      }
    }
  }

  @Step("Start onboarding")
  async startOnboarding(): Promise<void> {
    await waitForElementById(this.getStartedButtonId);
    const getStarted = this.onboardingGetStartedButton();
    await tapByElement(getStarted);
    await waitForElementById(new RegExp(`${this.setupLedger}|${this.acceptAnalyticsButtonId}`));
    try {
      await this.acceptAnalytics();
    } catch {
      // Analytics prompt not enabled
    }
  }

  @Step("Wait for analytics button to be visible")
  async waitForAnalyticsButtonToBeVisible(): Promise<void> {
    await waitForElementById(this.acceptAnalyticsButtonId);
  }

  @Step("Accept analytics")
  async acceptAnalytics(): Promise<void> {
    const analyticsBtn = this.acceptAnalyticsButton();
    await tapByElement(analyticsBtn);
  }
}
