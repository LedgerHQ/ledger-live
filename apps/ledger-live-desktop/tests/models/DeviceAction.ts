import { Page, Locator } from "@playwright/test";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  deviceInfo155 as deviceInfo,
  deviceInfo210lo5,
  mockListAppsResult as innerMockListAppResult,
} from "@ledgerhq/live-common/apps/mock";
import { AppOp } from "@ledgerhq/live-common/apps/types";
import { AppType, DeviceInfo } from "@ledgerhq/types-live/lib/manager";

const mockListAppsResult = (
  appDesc: string,
  installedDesc: string,
  deviceInfo: DeviceInfo,
  deviceModelId?: DeviceModelId,
) => {
  // Nb Should move this polyfill to live-common eventually.
  const result = innerMockListAppResult(appDesc, installedDesc, deviceInfo, deviceModelId);
  Object.keys(result?.appByName).forEach(key => {
    result.appByName[key] = { ...result.appByName[key], type: AppType.currency };
  });
  return result;
};

export class DeviceAction {
  readonly page: Page;
  readonly loader: Locator;
  readonly swapSummary: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loader = page.getByTestId("device-action-loader");
    this.swapSummary = page.getByTestId("device-swap-summary");
  }

  async openApp() {
    await this.page.evaluate(() => {
      window.mock.events.mockDeviceEvent({ type: "opened" });
    });

    await this.loader.waitFor({ state: "visible", timeout: 20000 }).catch(e => {
      console.warn(
        "loader is accepted not to be visible at all if the UI was fast enough. this is a very rare case.",
        e,
      );
    });
    await this.loader.waitFor({ state: "detached" });
  }

  async genuineCheck(appDesc = "Bitcoin", installedDesc = "Bitcoin") {
    const result = mockListAppsResult(appDesc, installedDesc, deviceInfo);
    const modelId = DeviceModelId.nanoS;

    await this.page.evaluate(
      args => {
        const [deviceInfo, result, modelId] = args;

        window.mock.events.mockDeviceEvent(
          {
            type: "deviceChange",
            device: {
              deviceId: "",
              deviceName: "Some name",
              modelId,
            },
            replaceable: false,
          },
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
      [deviceInfo, result, modelId],
    );

    await this.loader.waitFor({ state: "hidden" });
  }

  async accessManager(
    appDesc = "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar",
    installedDesc = "Bitcoin,Litecoin,Ethereum (outdated)",
    deviceModelId?: DeviceModelId,
  ) {
    const result = mockListAppsResult(appDesc, installedDesc, deviceInfo, deviceModelId);
    const modelId = DeviceModelId.nanoS;

    await this.page.evaluate(
      args => {
        const [deviceInfo, result, modelId] = args;

        window.mock.events.mockDeviceEvent(
          {
            type: "deviceChange",
            device: {
              deviceId: "",
              deviceName: "Some name",
              modelId,
            },
            replaceable: false,
          },
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
      [deviceInfo, result, modelId],
    );

    await this.loader.waitFor({ state: "hidden" });
  }

  async accessManagerWithL10n(
    appDesc = "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar",
    installedDesc = "Bitcoin,Litecoin,Ethereum (outdated)",
  ) {
    const result = mockListAppsResult(appDesc, installedDesc, deviceInfo210lo5);
    const modelId = DeviceModelId.nanoS;

    await this.page.evaluate(
      args => {
        const [deviceInfo210lo5, result, modelId] = args;

        window.mock.events.mockDeviceEvent(
          {
            type: "deviceChange",
            device: {
              deviceId: "",
              deviceName: "Some name",
              modelId,
            },
            replaceable: false,
          },
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
      [deviceInfo210lo5, result, modelId],
    );

    await this.loader.waitFor({ state: "hidden" });
  }

  async complete() {
    await this.page.evaluate(() => {
      window.mock.events.mockDeviceEvent({ type: "complete" });
    });
  }

  async initiateLanguageInstallation() {
    await this.page.evaluate(() => {
      window.mock.events.mockDeviceEvent({ type: "devicePermissionRequested" });
    });
  }

  async add50ProgressToLanguageInstallation() {
    await this.page.evaluate(() => {
      window.mock.events.mockDeviceEvent({ type: "progress", progress: 0.5 });
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

        window.mock.events.mockDeviceEvent({
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

        window.mock.events.mockDeviceEvent({
          type: "listed-apps",
          installQueue: installQueue,
        });
      },
      [installQueue],
    );
  }

  async mockOpened() {
    await this.page.evaluate(() => {
      window.mock.events.mockDeviceEvent({ type: "opened" });
    });
  }

  async completeLanguageInstallation() {
    await this.page.evaluate(() => {
      window.mock.events.mockDeviceEvent({ type: "languageInstalled" });
    });
  }

  async requestImageLoad() {
    await this.page.evaluate(() => {
      window.mock.events.mockDeviceEvent({ type: "loadImagePermissionRequested" });
    });
  }

  async loadImageWithProgress(progress: number) {
    await this.page.evaluate(
      ([progress]) => {
        window.mock.events.mockDeviceEvent({ type: "progress", progress });
      },
      [progress],
    );
  }

  async requestImageCommit() {
    await this.page.evaluate(() => {
      window.mock.events.mockDeviceEvent({ type: "commitImagePermissionRequested" });
    });
  }

  async confirmImageLoaded() {
    await this.page.evaluate(() => {
      window.mock.events.mockDeviceEvent({ type: "imageLoaded", imageSize: 35305 });
    });
  }

  async silentSign() {
    await this.page.evaluate(() => {
      window.mock.events.mockDeviceEvent({ type: "opened" }, { type: "complete" });
    });
  }
}
