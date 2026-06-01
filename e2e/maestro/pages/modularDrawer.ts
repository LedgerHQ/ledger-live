import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { MaestroApp } from "./app";

export class ModularDrawerPage {
  readonly searchInputId = "modular-drawer-search-input";
  readonly addAccountsContinueButtonId = "enabled-add-accounts-continue-button";
  readonly accountItemId = "account-item";
  readonly assetItemId = (ticker: string) => `asset-item-${ticker}`;
  readonly networkItemId = (network: string) => `network-item-${network}`;

  constructor(private readonly app: MaestroApp) {}

  private getNetworkName(account: Account): string {
    return account.parentAccount === undefined
      ? account.currency.speculosApp.name
      : account.parentAccount.currency.name;
  }

  async selectAsset(account: Account) {
    const ticker = account.currency.ticker;
    const network = this.getNetworkName(account);
    await this.app.runNativeFlow(`mad-select-${ticker}`, [
      { extendedWaitUntil: { visible: { id: this.searchInputId } } },
      { tapOn: { id: this.searchInputId } },
      { inputText: ticker },
      { tapOn: { id: this.assetItemId(ticker), index: 0, retryTapIfNoChange: true } },
      {
        runFlow: {
          when: { visible: { id: this.networkItemId(network) } },
          commands: [
            { tapOn: { id: this.networkItemId(network), index: 0, retryTapIfNoChange: true } },
          ],
        },
      },
      { tapOn: { id: this.accountItemId, index: 0, retryTapIfNoChange: true } },
    ]);
  }

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
