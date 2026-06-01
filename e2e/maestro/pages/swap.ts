import { MaestroApp } from "./app";

export class SwapPage {
  readonly walletApiWebviewId = "wallet-api-webview";
  readonly swapSuccessTitleId = "swap-success-title";
  readonly proceedButtonId = "proceed-button";

  constructor(private readonly app: MaestroApp) {}

  async openViaDeeplink() {
    await this.app.openDeepLink("ledgerlive://swap");
  }

  async expectWalletApiWebview() {
    await this.app.runNativeFlow("swap-webview-ready", [
      {
        extendedWaitUntil: {
          visible: {
            id: this.walletApiWebviewId,
          },
        },
      },
    ]);
  }

  async waitForSuccessAndContinue() {
    await this.app.runNativeFlow("swap-success-and-continue", [
      {
        extendedWaitUntil: {
          visible: {
            id: this.swapSuccessTitleId,
          },
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
