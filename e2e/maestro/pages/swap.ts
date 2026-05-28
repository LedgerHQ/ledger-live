import { MaestroApp } from "./app";

export class SwapPage {
  readonly walletApiWebviewId = "wallet-api-webview";
  readonly swapSuccessTitleId = "swap-success-title";
  readonly proceedButtonId = "proceed-button";

  constructor(private readonly app: MaestroApp) {}

  openViaDeeplink() {
    this.app.openDeepLink("ledgerlive://swap");
  }

  async expectWalletApiWebview(timeoutMs: number = 60_000) {
    await this.app.runNativeFlow("swap-webview-ready", [
      {
        extendedWaitUntil: {
          visible: {
            id: this.walletApiWebviewId,
          },
          timeout: timeoutMs,
        },
      },
    ]);
  }

  async waitForSuccessAndContinue(timeoutMs: number = 120_000) {
    await this.app.runNativeFlow("swap-success-and-continue", [
      {
        extendedWaitUntil: {
          visible: {
            id: this.swapSuccessTitleId,
          },
          timeout: timeoutMs,
        },
      },
      {
        tapOn: {
          id: this.proceedButtonId,
        },
      },
    ]);
  }
}
