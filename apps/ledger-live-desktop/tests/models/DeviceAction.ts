import { Page, Locator } from "@playwright/test";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  deviceInfo155 as deviceInfo,
  deviceInfo210lo5,
  mockListAppsResult as innerMockListAppResult,
} from "@ledgerhq/live-common/apps/mock";
import { AppOp } from "@ledgerhq/live-common/apps/types";

const mockListAppsResult = (...params) => {
  // Nb Should move this polyfill to live-common eventually.
  const result = innerMockListAppResult(...params);
  Object.keys(result?.appByName).forEach(key => {
    result.appByName[key] = { ...result.appByName[key], type: "app" };
  });
  return result;
};

export class DeviceAction {
  readonly page: Page;
  readonly loader: Locator;
  readonly swapSummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loader = page.locator("data-test-id=device-action-loader");
    this.swapSummary = page.locator("data-test-id=device-swap-summary");
  }

  async openApp() {
    await this.page.evaluate(() => {
      (window as any).mock.events.mockDeviceEvent({ type: "opened" });
    });

    await this.loader.waitFor({ state: "visible" });
    await this.loader.waitFor({ state: "detached" });
  }

  async genuineCheck(appDesc = "Bitcoin", installedDesc = "Bitcoin") {
    const result = mockListAppsResult(appDesc, installedDesc, deviceInfo);

    await this.page.evaluate(
      args => {
        const [deviceInfo, result] = args;

        (window as any).mock.events.mockDeviceEvent(
          {
            type: "listingApps",
            deviceInfo,
          },
          {
            type: "result",
            result,
          },
          { type: "complete" },
        );
      },
      [deviceInfo, result],
    );

    await this.loader.waitFor({ state: "hidden" });
  }

  async accessManager(
    appDesc = "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar",
    installedDesc = "Bitcoin,Litecoin,Ethereum (outdated)",
    deviceModelId?: DeviceModelId,
  ) {
    const result = mockListAppsResult(appDesc, installedDesc, deviceInfo, deviceModelId);

    await this.page.evaluate(
      args => {
        const [deviceInfo, result] = args;

        (window as any).mock.events.mockDeviceEvent(
          {
            type: "listingApps",
            deviceInfo,
          },
          {
            type: "result",
            result,
          },
          { type: "complete" },
        );
      },
      [deviceInfo, result],
    );

    await this.loader.waitFor({ state: "hidden" });
  }

  async accessManagerWithL10n(
    appDesc = "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar",
    installedDesc = "Bitcoin,Litecoin,Ethereum (outdated)",
  ) {
    const result = mockListAppsResult(appDesc, installedDesc, deviceInfo210lo5);

    await this.page.evaluate(
      args => {
        const [deviceInfo210lo5, result] = args;

        (window as any).mock.events.mockDeviceEvent(
          {
            type: "listingApps",
            deviceInfo: deviceInfo210lo5,
          },
          {
            type: "result",
            result,
          },
          { type: "complete" },
        );
      },
      [deviceInfo210lo5, result],
    );

    await this.loader.waitFor({ state: "hidden" });
  }

  async complete() {
    await this.page.evaluate(() => {
      (window as any).mock.events.mockDeviceEvent({ type: "complete" });
    });
  }

  async initiateLanguageInstallation() {
    await this.page.evaluate(() => {
      (window as any).mock.events.mockDeviceEvent({ type: "devicePermissionRequested" });
    });
  }

  async add50ProgressToLanguageInstallation() {
    await this.page.evaluate(() => {
      (window as any).mock.events.mockDeviceEvent({ type: "progress", progress: 0.5 });
    });
  }

  async installSetOfAppsMocked(
    progress: number,
    itemProgress: number,
    currentAppOp: AppOp,
    installQueue: string[],
  ) {
    await this.page.evaluate(
      args => {
        const [progress, itemProgress, currentAppOp, installQueue] = args;

        (window as any).mock.events.mockDeviceEvent({
          type: "inline-install",
          progress: progress,
          itemProgress: itemProgress,
          currentAppOp: currentAppOp,
          installQueue: installQueue,
        });
      },
      [progress, itemProgress, currentAppOp, installQueue],
    );
  }

  async resolveDependenciesMocked(installQueue: string[]) {
    await this.page.evaluate(
      args => {
        const [installQueue] = args;

        (window as any).mock.events.mockDeviceEvent({
          type: "listed-apps",
          installQueue: installQueue,
        });
      },
      [installQueue],
    );
  }

  async mockOpened() {
    await this.page.evaluate(() => {
      (window as any).mock.events.mockDeviceEvent({ type: "opened" });
    });
  }

  async completeLanguageInstallation() {
    await this.page.evaluate(() => {
      (window as any).mock.events.mockDeviceEvent({ type: "languageInstalled" });
    });
  }

  async requestImageLoad() {
    await this.page.evaluate(() => {
      (window as any).mock.events.mockDeviceEvent({ type: "loadImagePermissionRequested" });
    });
  }

  async loadImageWithProgress(progress: number) {
    await this.page.evaluate(
      ([progress]) => {
        (window as any).mock.events.mockDeviceEvent({ type: "progress", progress });
      },
      [progress],
    );
  }

  async requestImageCommit() {
    await this.page.evaluate(() => {
      (window as any).mock.events.mockDeviceEvent({ type: "commitImagePermissionRequested" });
    });
  }

  async confirmImageLoaded() {
    await this.page.evaluate(() => {
      (window as any).mock.events.mockDeviceEvent({ type: "imageLoaded", imageSize: 35305 });
    });
  }

  async initiateSwap() {
    await this.page.evaluate(() => (window as any).mock.events.mockDeviceEvent({ type: "opened" }));
    await this.page.waitForTimeout(500);
    await this.page.evaluate(() =>
      (window as any).mock.events.mockDeviceEvent({ type: "complete" }),
    );
    await this.page.waitForTimeout(500);
    await this.page.evaluate(() =>
      (window as any).mock.events.mockDeviceEvent({ type: "init-swap-requested" }),
    );

    await this.loader.waitFor({ state: "detached" });
    await this.swapSummary.waitFor({ state: "visible" });
  }

  async confirmSwap() {
    await this.page.evaluate(() => {
      const mock = (window as any).mock;
      const transaction = mock.fromTransactionRaw({
        family: "bitcoin",
        recipient: "1Cz2ZXb6Y6AacXJTpo4RBjQMLEmscuxD8e",
        amount: "12",
        feePerByte: "1",
        networkInfo: {
          family: "bitcoin",
          feeItems: {
            items: [
              { key: "0", speed: "high", feePerByte: "3" },
              { key: "1", speed: "standard", feePerByte: "2" },
              { key: "2", speed: "low", feePerByte: "1" },
            ],
            defaultFeePerByte: "1",
          },
        },
        rbf: false,
        utxoStrategy: {
          strategy: 0,
          excludeUTXOs: [],
        },
      });
      mock.events.mockDeviceEvent(
        {
          type: "init-swap-result",
          initSwapResult: {
            transaction,
            swapId: "12345",
          },
        },
        {
          type: "complete",
        },
      );
    });
  }

  async silentSign() {
    await this.page.evaluate(() => {
      (window as any).mock.events.mockDeviceEvent({ type: "opened" }, { type: "complete" });
    });
  }
}
