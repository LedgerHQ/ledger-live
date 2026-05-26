import { MaestroApp } from "./app";

export class PortfolioPage {
  readonly portfolioScreenId = "portfolio-screen";
  readonly assetItemId = (assetId: string) => `assetItem-${assetId}`;

  constructor(private readonly app: MaestroApp) {}

  async expectReady() {
    await this.app.runNativeFlow("portfolio-ready", [
      {
        extendedWaitUntil: {
          visible: {
            id: this.portfolioScreenId,
          },
        },
      },
    ]);
  }

  openAddAccount() {
    this.app.openDeepLink("ledgerlive://add-account");
  }

  async expectAsset(assetId: string) {
    await this.app.runNativeFlow(`portfolio-asset-${assetId}`, [
      {
        extendedWaitUntil: {
          visible: {
            id: this.assetItemId(assetId),
          },
          timeout: 120_000,
        },
      },
    ]);
  }
}
