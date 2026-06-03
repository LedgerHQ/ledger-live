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

  selectAsset(account: Account): void {
    const ticker = account.currency.ticker;
    const network = this.getNetworkName(account);
    this.app.addStep(`mad-select-${ticker}`, [
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

  selectAssetForAddAccount(ticker: string): void {
    this.app.addStep(`select-${ticker}-for-add-account`, [
      { tapOn: { id: this.assetItemId(ticker), retryTapIfNoChange: true } },
    ]);
  }

  confirmAddAccount(): void {
    this.app.addStep("confirm-add-account", [{ tapOn: { id: this.addAccountsContinueButtonId } }]);
  }
}
