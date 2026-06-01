import { MaestroApp } from "./app";

export class ModularDrawerPage {
  readonly searchInputId = "modular-drawer-search-input";
  readonly addAccountsContinueButtonId = "enabled-add-accounts-continue-button";
  readonly assetItemId = (ticker: string) => `asset-item-${ticker}`;

  constructor(private readonly app: MaestroApp) {}

  async selectAssetForAddAccount(ticker: string) {
    await this.app.runNativeFlow(`select-${ticker}-for-add-account`, [
      {
        extendedWaitUntil: {
          visible: {
            id: this.searchInputId,
          },
        },
      },
      {
        extendedWaitUntil: {
          visible: {
            id: this.assetItemId(ticker),
          },
        },
      },
      {
        tapOn: {
          id: this.assetItemId(ticker),
          retryTapIfNoChange: true,
        },
      },
    ]);
  }

  async confirmAddAccount() {
    await this.app.runNativeFlow("confirm-add-account", [
      {
        extendedWaitUntil: {
          visible: {
            id: this.addAccountsContinueButtonId,
          },
        },
      },
      {
        tapOn: {
          id: this.addAccountsContinueButtonId,
        },
      },
    ]);
  }
}
