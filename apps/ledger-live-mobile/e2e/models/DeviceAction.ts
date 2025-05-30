import BigNumber from "bignumber.js";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  deviceInfo155 as deviceInfo,
  deviceInfo210lo5,
  mockListAppsResult as innerMockListAppResult,
} from "@ledgerhq/live-common/apps/mock";
import { AppOp } from "@ledgerhq/live-common/apps/types";
import { AppType, DeviceInfo } from "@ledgerhq/types-live/lib/manager";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { delay } from "../helpers/commonHelpers";
import { mockDeviceEvent } from "../bridge/server";
import { DeviceLike } from "~/reducers/types";

const mockListAppsResult = (
  appDesc: string,
  installedDesc: string,
  deviceInfo: DeviceInfo,
  deviceModelId?: DeviceModelId,
  deviceName?: string | null,
) => {
  const result = innerMockListAppResult(
    appDesc,
    installedDesc,
    deviceInfo,
    deviceModelId,
    deviceName,
  );
  Object.keys(result?.appByName).forEach(key => {
    result.appByName[key] = { ...result.appByName[key], type: AppType.currency };
  });
  return result;
};

// this implement mock for the "legacy" device action (the one working with live-common/lib/hw/actions/*)
export default class DeviceAction {
  device: Device;

  constructor(input: DeviceLike | Device) {
    if ("id" in input) {
      this.device = this.deviceLikeToDevice(input as DeviceLike);
    } else {
      this.device = input;
    }
  }

  deviceLikeToDevice(d: DeviceLike): Device {
    return {
      deviceId: d.id,
      deviceName: d.name,
      modelId: d.modelId,
      wired: false,
    };
  }

  async selectMockDevice() {
    const elId = "device-item-" + this.device.deviceId;
    await waitForElementById(elId);
    await tapById(elId);
  }

  async waitForSpinner() {
    await waitForElementById("device-action-loading");
  }

  async openApp() {
    await this.waitForSpinner();
    await mockDeviceEvent({ type: "opened" });
  }

  async genuineCheck(appDesc = "Bitcoin", installedDesc = "Bitcoin") {
    await this.waitForSpinner();

    const { device } = this;
    const result = mockListAppsResult(appDesc, installedDesc, deviceInfo);
    await mockDeviceEvent(
      {
        type: "deviceChange",
        device,
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
  }

  async accessManager(
    appDesc = "Bitcoin,Tron,Litecoin,Ethereum,XRP,Stellar",
    installedDesc = "Bitcoin,Litecoin,Ethereum (outdated)",
  ) {
    await this.waitForSpinner();

    const { device } = this;

    const result = mockListAppsResult(
      appDesc,
      installedDesc,
      deviceInfo,
      device.modelId,
      device.deviceName,
    );
    await mockDeviceEvent(
      {
        type: "deviceChange",
        device,
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
  }

  async accessManagerWithL10n(
    appDesc = "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar",
    installedDesc = "Bitcoin,Litecoin,Ethereum (outdated)",
  ) {
    await this.waitForSpinner();

    const { device } = this;

    const result = mockListAppsResult(appDesc, installedDesc, deviceInfo210lo5);
    await mockDeviceEvent(
      {
        type: "deviceChange",
        device,
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
  }

  async complete() {
    await mockDeviceEvent({ type: "complete" });
  }

  async initiateLanguageInstallation() {
    await mockDeviceEvent({ type: "devicePermissionRequested" });
  }

  async add50ProgressToLanguageInstallation() {
    await mockDeviceEvent({ type: "progress", progress: 0.5 });
  }

  async installSetOfAppsMocked(
    progress: number,
    itemProgress: number,
    currentAppOp: AppOp,
    installQueue: string[],
  ) {
    await mockDeviceEvent({
      type: "inline-install",
      progress: progress,
      itemProgress: itemProgress,
      currentAppOp: currentAppOp,
      installQueue: installQueue,
    });
  }

  async resolveDependenciesMocked(installQueue: string[]) {
    await mockDeviceEvent({
      type: "listed-apps",
      installQueue: installQueue,
    });
  }

  async completeLanguageInstallation() {
    await mockDeviceEvent({ type: "languageInstalled" });
  }

  async requestImageLoad() {
    await mockDeviceEvent({ type: "loadImagePermissionRequested" });
  }

  async loadImageWithProgress(progress: number) {
    await mockDeviceEvent({ type: "progress", progress });
  }

  async requestImageCommit() {
    await mockDeviceEvent({ type: "commitImagePermissionRequested" });
  }

  async confirmImageLoaded(imageSize: number, imageHash: string) {
    await mockDeviceEvent({ type: "imageLoaded", imageSize, imageHash });
  }

  async initiateSwap(estimatedFees: BigNumber) {
    await mockDeviceEvent({ type: "opened" });
    await delay(2000); // enough time to allow the UI to switch from one action to another
    await mockDeviceEvent({ type: "init-swap-requested", estimatedFees });
  }

  async confirmSwap(transaction: Transaction) {
    await mockDeviceEvent(
      {
        type: "init-swap-result",
        initSwapResult: {
          transaction,
          swapId: "12345",
          magnitudeAwareRate: new BigNumber(50000),
        },
      },
      {
        type: "complete",
      },
    );
  }

  async silentSign() {
    await this.waitForSpinner();
    await mockDeviceEvent({ type: "opened" }, { type: "complete" });
  }
}
