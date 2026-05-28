import { MaestroApp } from "./app";

/**
 * Drives the native modular drawer for the add-account flow.
 *
 * The swap flow does NOT go through this page object: when a swap live-app
 * triggers a wallet-api `account.request`, the e2e bridge's auto-pick mode
 * (enabled by `withMaestroSession({ swapSetup: true })`) resolves the first
 * matching account in-app and the drawer never opens. That avoids an iOS
 * XCUITest crash when querying the view hierarchy of a sheet over a
 * WebView, which Maestro can't recover from.
 */
export class ModularDrawerPage {
  readonly searchInputId = "modular-drawer-search-input";
  readonly addAccountsContinueButtonId = "enabled-add-accounts-continue-button";
  readonly assetItemId = (ticker: string) => `asset-item-${ticker}`;

  constructor(private readonly app: MaestroApp) {}

  async selectAssetForAddAccount(ticker: string, options: { discoveryTimeoutMs?: number } = {}) {
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

    await this.waitAddAccountDiscovery(options.discoveryTimeoutMs);
  }

  async waitAddAccountDiscovery(timeoutMs: number = 240_000) {
    await this.app.runNativeFlow("wait-add-account-discovery", [
      {
        extendedWaitUntil: {
          visible: {
            id: this.addAccountsContinueButtonId,
          },
          timeout: timeoutMs,
        },
      },
    ]);
  }

  async confirmAddAccount() {
    await this.app.runNativeFlow("confirm-add-account", [
      {
        tapOn: {
          id: this.addAccountsContinueButtonId,
        },
      },
    ]);
  }
}
