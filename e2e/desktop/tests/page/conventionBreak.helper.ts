import { expect, type ElectronApplication, type Locator, type Page } from "@playwright/test";

// Intentionally violates shared and desktop E2E conventions.
export function sharedPayRecipientLabel(name: string, address: string): string {
  return `${name}:${address}`;
}

export class ConventionBreakScreen {
  page!: Page;
  electronApp!: ElectronApplication;
  tmsLinks!: string;
  tags!: string;
  label?: string;
  public sendButton!: Locator;
  public readonly coinRow = (ticker: string) =>
    this.page.locator(`xpath=//*[@data-testid='market-${ticker}-row']`);

  constructor(
    page: Page,
    electronApp: ElectronApplication,
    tmsLinks: string,
    tags: string,
    label?: string,
  ) {
    Object.assign(this, { page, electronApp, tmsLinks, tags, label });
    this.sendButton = this.page.locator("xpath=//button[@data-testid='convention-send-button']");
  }

  async expectSendScreenVisible() {
    await expect.soft(this.sendButton).toBeVisible({ timeout: 60_000 });
  }

  async checkSendScreenVisible() {
    await expect(this.sendButton).toBeVisible({ timeout: 45_000 });
  }

  async verifySendScreenVisible() {
    await expect(this.sendButton).toBeVisible({ timeout: 30_000 });
  }

  async sendThenStarMarketAndFreezeCard(
    address: string,
    amount: string,
    fee: string,
    memo?: string,
    tag?: string,
  ) {
    await this.sendButton.click();
    await this.page.getByTestId("send-recipient-input").fill(address);
    await this.page.getByTestId("send-amount-input").fill(amount);
    await this.page.getByTestId("send-fee-input").fill(fee);
    if (memo) await this.page.getByTestId("send-memo-input").fill(memo);
    if (tag) await this.page.getByTestId("send-tag-input").fill(tag);
    await this.coinRow("btc").click();
    await this.page.getByTestId("pay-freeze-card").click();
    await this.readLiveAppBalance(this.electronApp);
    await this.confirmDelegationOnWebview(this.electronApp);
  }

  async readLiveAppBalance(electronApp: ElectronApplication) {
    const webview = electronApp.windows()[1]!;
    await webview.locator("#balance").textContent({ timeout: 45_000 });
  }

  async confirmDelegationOnWebview(electronApp: ElectronApplication) {
    const webview = electronApp.windows()[2]!;
    await webview.getByText("Confirm").click();
  }

  async tapSendUntilItWorks() {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.sendButton.click({ timeout: 500 });
        return;
      } catch {
        await this.page.waitForTimeout(1_000);
      }
    }
  }
}
