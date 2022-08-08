import { Page } from "@playwright/test";
import { DiscoverPage } from "./DiscoverPage";

export class ReferralPage extends DiscoverPage {
  readonly page: Page;
  readonly selectAccountButton: string;
  readonly passwordInputSignup: string;
  readonly confirmPasswordInputSignup: string;
  readonly termsCheckboxSignup: string;
  readonly createButtonSignUp: string;
  readonly goBackButton: string;
  readonly gotoAccountButton: string;
  readonly passwordInputLogin: string;
  readonly copyLinkButton: string;
  readonly claimButton: string;
  readonly okButton: string;
  readonly passwordInputDelete: string;
  readonly confirmButtonDelete: string;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.selectAccountButton = 'button';
    this.passwordInputSignup = '[data-test-id="referral-signup-password"]';
    this.confirmPasswordInputSignup = '[data-test-id="referral-signup-confirm-password"]';
    this.termsCheckboxSignup = '[data-test-id="referral-signup-terms-checkbox"]';
    this.createButtonSignUp = '[data-test-id="referral-signup-create"]';
    this.goBackButton = '[data-test-id="referral-signup-goback-button"]';
    this.gotoAccountButton = '[data-test-id="referral-signup-gotoaccount-button"]';
    this.passwordInputLogin = '[data-test-id="referral-login-password"]';
    this.copyLinkButton = '[data-test-id="referral-copy-link-button"]';
    this.claimButton = '[data-test-id="referral-claim-button"]';
    this.okButton = '[data-test-id="referral-claim-ok-button"]';
    this.passwordInputDelete = '[data-test-id="referral-delete-password"]';
    this.confirmButtonDelete = '[data-test-id="referral-delete-confirm-button"]';
  }

  async clickToSelectAccount() {
    await this.clickWebviewElement(this.selectAccountButton);
  }

  async signUp(password: string, confirmPassword: string) {
    await this.fillWebviewElement(this.passwordInputSignup, password);
    await this.fillWebviewElement(this.confirmPasswordInputSignup, confirmPassword);
    await this.clickWebviewElement(this.termsCheckboxSignup);
    await this.clickWebviewElement(this.createButtonSignUp);
  }

  async gotoAccount() {
    await this.clickWebviewElement(this.gotoAccountButton);
  }

  async goBack() {
    await this.clickWebviewElement(this.goBackButton);
  }

  async login(password: string) {
    await this.fillWebviewElement(this.passwordInputLogin, password);
  }

  async copyLink() {
    await this.clickWebviewElement(this.copyLinkButton);
  }

  async claim() {
    await this.clickWebviewElement(this.claimButton);
  }

  async ok() {
    await this.clickWebviewElement(this.okButton);
  }

  async delete(password: string) {
    await this.fillWebviewElement(this.passwordInputDelete, password);
    await this.clickWebviewElement(this.confirmButtonDelete);
  }
}
