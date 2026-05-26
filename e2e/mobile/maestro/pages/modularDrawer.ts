import { MaestroApp } from "./app";

export class ModularDrawerPage {
  readonly searchInputId = "modular-drawer-search-input";
  readonly accountItemId = "account-item";
  readonly ethereumNetworkId = "network-item-Ethereum";
  readonly addAccountsContinueButtonId = "enabled-add-accounts-continue-button";
  readonly assetItemId = (ticker: string) => `asset-item-${ticker}`;

  constructor(private readonly app: MaestroApp) {}

  async expectAssetSelection() {
    await this.app.runNativeFlow("modular-drawer-ready", [
      {
        extendedWaitUntil: {
          visible: {
            id: this.searchInputId,
          },
        },
      },
    ]);
  }

  async selectAsset(ticker: string) {
    await this.app.runNativeFlow(`select-asset-${ticker}`, [
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
        },
      },
    ]);
  }

  async selectEthereumNetworkIfVisible() {
    await this.app.runNativeFlow("select-ethereum-network-if-visible", [
      {
        runFlow: {
          when: {
            visible: {
              id: this.ethereumNetworkId,
            },
          },
          commands: [
            {
              tapOn: {
                id: this.ethereumNetworkId,
              },
            },
          ],
        },
      },
    ]);
  }

  async selectFirstAccount() {
    await this.app.runNativeFlow("select-first-account", [
      {
        extendedWaitUntil: {
          visible: {
            id: this.accountItemId,
          },
        },
      },
      {
        tapOn: {
          id: this.accountItemId,
          index: 0,
        },
      },
    ]);
  }

  async selectAssetAndFirstAccount(ticker: string, options: { ethereumNetwork?: boolean } = {}) {
    await this.expectAssetSelection();
    await this.selectAsset(ticker);
    if (options.ethereumNetwork) {
      await this.selectEthereumNetworkIfVisible();
    }
    await this.selectFirstAccount();
  }

  async selectAssetForAddAccount(ticker: string) {
    await this.app
      .runNativeFlow(`select-${ticker}-for-add-account`, [
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
      ])
      .catch(error => {
        console.warn(
          `Asset selection flow for ${ticker} failed; checking whether add-account discovery started.`,
          error,
        );
      });

    await this.waitAddAccountDiscovery();
  }

  async waitAddAccountDiscovery() {
    await this.app.runNativeFlow("wait-add-account-discovery", [
      {
        extendedWaitUntil: {
          visible: {
            id: this.addAccountsContinueButtonId,
          },
          timeout: 240_000,
        },
      },
    ]);
  }

  async confirmAddAccount() {
    await this.app
      .runNativeFlow("confirm-add-account", [
        {
          tapOn: {
            id: this.addAccountsContinueButtonId,
          },
        },
      ])
      .catch(error => {
        console.warn(
          "Confirm add-account reported a Maestro failure; checking final portfolio state.",
          error,
        );
      });
  }
}
