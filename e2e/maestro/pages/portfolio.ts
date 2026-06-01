import { MaestroApp } from "./app";

export class PortfolioPage {
  readonly assetItemId = (assetId: string) => `assetItem-${assetId}`;

  constructor(private readonly app: MaestroApp) {}

  async openAddAccount() {
    await this.app.openDeepLink("ledgerlive://add-account");
  }

  async expectAsset(assetId: string) {
    await this.app.runNativeFlow(`portfolio-asset-${assetId}`, [
      {
        extendedWaitUntil: {
          visible: {
            id: this.assetItemId(assetId),
          },
        },
      },
    ]);
  }
}
