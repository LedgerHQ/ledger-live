import { AppPage } from "tests/page/abstractClasses";

export class LockscreenPage extends AppPage {
  readonly container = this.page.locator("data-test-id=lockscreen-container");
  private passwordInput = this.page.locator("data-test-id=lockscreen-password-input");
  private forgottenButton = this.page.locator("data-test-id=lockscreen-forgotten-button");
  private loginButton = this.page.locator("data-test-id=lockscreen-login-button");

  async login(password: string) {
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async lostPassword() {
    await this.forgottenButton.click();
  }
}
