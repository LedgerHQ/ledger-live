import { Page, Locator } from "@playwright/test";
import { DiscoverPage } from "./DiscoverPage";

export class ReferralPage extends DiscoverPage {
  readonly page: Page;
  readonly passwordInputSignup: Locator;
  readonly confirmPasswordInputSignup: Locator;
  readonly termsCheckboxSignup: Locator;
  readonly createButtonSignUp: Locator;
  readonly goBackButton: Locator;
  readonly gotoAccountButton: Locator;
  readonly passwordInputLogin: Locator;
  readonly copyLinkButton: Locator
  readonly claimButton: Locator;
  readonly okButton: Locator;
  readonly passwordInputDelete: Locator;
  readonly confirmButtonDelete: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.passwordInputSignup = page.locator('data-test-id="referral-signup-password"');
    this.confirmPasswordInputSignup = page.locator('data-test-id="referral-signup-confirm-password"');
    this.termsCheckboxSignup = page.locator('data-test-id="referral-signup-terms-checkbox"');
    this.createButtonSignUp = page.locator('data-test-id="referral-signup-create"');
    this.goBackButton = page.locator('data-test-id="referral-signup-goback-button"');
    this.gotoAccountButton = page.locator('data-test-id="referral-signup-gotoaccount-button"');
    this.passwordInputLogin = page.locator('data-test-id="referral-login-password"');
    this.copyLinkButton = page.locator('data-test-id="referral-copy-link-button"');
    this.claimButton = page.locator('data-test-id="referral-claim-button"');
    this.okButton = page.locator('data-test-id="referral-claim-ok-button"');
    this.passwordInputDelete = page.locator('data-test-id="referral-delete-password"');
    this.confirmButtonDelete = page.locator('data-test-id="referral-delete-confirm-button"');
  }

  async signUp(password: string, confirmPassword: string) {
    await this.page.pause();
    await this.passwordInputSignup.fill(password);
    await this.confirmPasswordInputSignup.fill(confirmPassword);
    await this.termsCheckboxSignup.check();
    await this.createButtonSignUp.click();
  }

  async gotoAccount() {
    await this.page.pause();
    await this.gotoAccountButton.click();
  }

  async goBack() {
    await this.page.pause();
    await this.goBackButton.click();
  }

  async login(password: string) {
    await this.page.pause();
    await this.passwordInputLogin.fill(password);
  }

  async copyLink() {
    await this.page.pause();
    await this.copyLinkButton.click();
  }

  async claim() {
    await this.page.pause();
    await this.claimButton.click();
  }

  async ok() {
    await this.page.pause();
    await this.okButton.click();
  }

  async delete(password: string) {
    await this.page.pause();
    await this.passwordInputDelete.fill(password);
    await this.confirmButtonDelete.click();
  }
}
