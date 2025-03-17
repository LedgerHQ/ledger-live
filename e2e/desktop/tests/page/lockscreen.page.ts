import { AppPage } from "./abstractClasses";
import { step } from "../misc/reporters/step";

export class LockscreenPage extends AppPage {
  readonly container = this.page.getByTestId("lockscreen-container");
  private passwordInput = this.page.getByTestId("lockscreen-password-input");
  private forgottenButton = this.page.getByTestId("lockscreen-forgotten-button");
  private loginButton = this.page.getByTestId("lockscreen-login-button");
  readonly inputError = this.page.locator("id=input-error"); // no data-testid because css style is applied
  readonly logo = this.page.getByTestId("logo");

  async login(password: string) {
    await this.container.waitFor({ state: "visible" });
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async lostPassword() {
    await this.forgottenButton.click();
  }

  @step("Check input error state visibibility: $0")
  async checkInputErrorVisibility(expectedState: "visible" | "hidden") {
    await this.inputError.waitFor({ state: expectedState });
  }

  @step("Expect Ledger Logo to be visible")
  async expectLogoToBeVisible() {
    await this.logo.waitFor({ state: "visible" });
  }
}
