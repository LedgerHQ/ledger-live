import { MaestroApp } from "./app";

export class PortfolioPage {
  readonly assetItemId = (assetId: string) => `assetItem-${assetId}`;

  constructor(private readonly app: MaestroApp) {}

  openAddAccount(): void {
    this.app.openDeepLink("ledgerlive://add-account");
  }

  expectAsset(assetId: string): void {
    this.app.addStep(`portfolio-asset-${assetId}`, [
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
