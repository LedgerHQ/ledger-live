/* eslint-disable no-console */
import { from } from "rxjs";
import fs from "fs";
import type { ScanCommonOpts } from "../../scan";
import { deviceOpt } from "../../scan";
import customLockScreenFetch from "@ledgerhq/live-common/hw/customLockScreenFetch";
import {
  isCustomLockScreenSupported,
  CLSSupportedDeviceModelId,
} from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";

export type CustomLockScreenFetchJobOpts = ScanCommonOpts & {
  fileOutput: string;
  deviceModelId: string;
};

const exec = async (opts: CustomLockScreenFetchJobOpts) => {
  const { device: deviceId = "", fileOutput, deviceModelId } = opts;
  const clsSupportedDeviceModelId = deviceModelId as CLSSupportedDeviceModelId;
  if (!isCustomLockScreenSupported(clsSupportedDeviceModelId)) {
    console.error("This device model does not support custom lock screen");
    return;
  }
  await new Promise<void>(p =>
    customLockScreenFetch({
      deviceId,
      request: { allowedEmpty: false, deviceModelId: clsSupportedDeviceModelId },
    }).subscribe(
      event => {
        if (event.type === "imageFetched") {
          const { hexImage } = event;
          if (!fileOutput) {
            console.log(hexImage);
          } else {
            fs.writeFileSync(fileOutput, hexImage);
            console.log(`${fileOutput} written`);
          }
        } else {
          console.log(event);
        }
      },
      e => {
        console.error(e);
        p();
      },
      () => {
        console.log(`Image fetched.`);
        p();
      },
    ),
  );
};

export default {
  description: "Test fetching of the custom lock screen picture from a device",
  args: [
    deviceOpt,
    {
      name: "fileOutput",
      alias: "o",
      type: String,
      desc: "Output file path in case you want to save Hex string image",
    },
    {
      name: "deviceModelId",
      type: String,
      desc: "The device model id to use",
    },
  ],
  job: (opts: CustomLockScreenFetchJobOpts): any => from(exec(opts)),
};
