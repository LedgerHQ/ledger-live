import { Component } from "tests/page/abstractClasses";

export class LanguageInstallation extends Component {
  readonly installLanguageButton = this.page.getByTestId("install-language-button");
  readonly languageInstalled = this.page.getByTestId("language-installed");
  readonly allowLanguageInstallation = this.page.getByTestId("allow-language-installation");
  readonly installingLanguageProgress = this.page.getByTestId("installing-language-progress");
}
