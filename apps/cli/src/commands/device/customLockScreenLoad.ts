import { from } from "rxjs";
import fs from "fs";
import type { ScanCommonOpts } from "../../scan";
import customLockScreenLoad from "@ledgerhq/live-common/hw/customLockScreenLoad";
import { deviceOpt } from "../../scan";
import {
  CLSSupportedDeviceModelId,
  isCustomLockScreenSupported,
} from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import { DeviceModelId } from "@ledgerhq/types-devices";

export type CustomLockScreenLoadJobOpts = ScanCommonOpts & {
  fileInput: string;
  deviceModelId: string;
};

const exec = async (opts: CustomLockScreenLoadJobOpts) => {
  const { fileInput, device: deviceId = "", deviceModelId } = opts;
  if (!isCustomLockScreenSupported(deviceModelId as DeviceModelId)) {
    console.error("This device model does not support custom lock screen");
    return;
  }
  const clsSupportedDeviceModelId = deviceModelId as CLSSupportedDeviceModelId;
  const hexImage = fs.readFileSync(fileInput, "utf-8");

  await new Promise<void>(resolve =>
    customLockScreenLoad({
      deviceId,
      request: { hexImage, deviceModelId: clsSupportedDeviceModelId },
    }).subscribe(
      x => console.log(x),
      e => {
        console.error(e);
        resolve();
      },
      () => {
        console.log(`Image loaded.`);
        resolve();
      },
    ),
  );
};

export default {
  description: "Test lock screen customization by loading an image",
  args: [
    deviceOpt,
    {
      name: "fileInput",
      alias: "i",
      type: String,
      desc: "Text file containing the hex data of the image to load on device as a custom lock screen",
    },
    {
      name: "deviceModelId",
      type: String,
      desc: "The device model id to use",
    },
  ],
  job: (opts: CustomLockScreenLoadJobOpts): any => from(exec(opts)),
};
