import { Component } from "tests/page/abstractClasses";

export class LanguageInstallation extends Component {
  readonly installLanguageButton = this.page.locator("data-test-id=install-language-button");
  readonly languageInstalled = this.page.locator("data-test-id=language-installed");
  readonly allowLanguageInstallation = this.page.locator(
    "data-test-id=allow-language-installation",
  );
  readonly installingLanguageProgress = this.page.locator(
    "data-test-id=installing-language-progress",
  );
}
