import { Page, Locator } from "@playwright/test";

export class LanguageInstallation {
  readonly page: Page;

  readonly installLanguageButton: Locator;
  readonly closeLanguageInstallationButton: Locator;
  readonly languageInstalled: Locator;
  readonly allowLanguageInstallation: Locator;
  readonly installingLanguageProgress: Locator;

  constructor(page: Page) {
    this.page = page;

    this.installLanguageButton = page.locator("data-test-id=install-language-button");
    this.closeLanguageInstallationButton = page.locator(
      "data-test-id=close-language-installation-button",
    );
    this.languageInstalled = page.locator("data-test-id=language-installed");
    this.allowLanguageInstallation = page.locator("data-test-id=allow-language-installation");
    this.installingLanguageProgress = page.locator("data-test-id=installing-language-progress");
  }
}
