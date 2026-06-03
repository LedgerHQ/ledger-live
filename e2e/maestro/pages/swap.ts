import { MaestroApp } from "./app";

export class SwapPage {
  readonly swapSuccessTitleId = "swap-success-title";
  readonly proceedButtonId = "proceed-button";

  constructor(private readonly app: MaestroApp) {}

  async openViaDeeplink(): Promise<void> {
    await this.app.openDeepLink("ledgerlive://swap");
  }

  waitForSuccessAndContinue(): void {
    this.app.addStep("swap-success-and-continue", [
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
