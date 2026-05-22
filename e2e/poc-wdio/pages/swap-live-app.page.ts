export class SwapLiveAppPage {
  // webview components
  public readonly fromSelector = $('[data-testid="from-account-coin-selector"]');
  public readonly toSelector = $('[data-testid="to-account-coin-selector"]');
  public readonly quotesButtonDisabled = $('[data-testid="mobile-get-quotes-button-disabled"]');

  // steps
  async switchTo() {
    await driver.waitUntil(
      async () => {
        await driver.switchContext({ title: /swap/i });
        return true;
      },
      {
        timeout: 15_000,
        timeoutMsg: "Expected to find swap live app context",
      },
    );
  }
  async expectLiveApp() {
    // DETOX:
    // await waitWebElementByTestId(this.fromSelector);
    // await detoxExpect(getWebElementByTestId(this.fromSelector)).toExist();
    // await detoxExpect(getWebElementByTestId(this.toSelector)).toExist();
    // await detoxExpect(getWebElementByTestId(this.quotesButtonDisabled)).toExist();

    // WDIO:
    await this.switchTo();
    await expect(this.fromSelector).toBeDisplayed();
    await expect(this.toSelector).toBeDisplayed();
    await expect(this.quotesButtonDisabled).toBeDisplayed();
    await driver.switchContext("NATIVE_APP");
  }
}
