import { AppPage } from "tests/page/abstractClasses";

export class LockscreenPage extends AppPage {
  readonly container = this.page.getByTestId("lockscreen-container");
  private passwordInput = this.page.getByTestId("lockscreen-password-input");
  private forgottenButton = this.page.getByTestId("lockscreen-forgotten-button");
  private loginButton = this.page.getByTestId("lockscreen-login-button");

  async login(password: string) {
    await this.container.waitFor({ state: "visible" });
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async lostPassword() {
    await this.forgottenButton.click();
  }
}
