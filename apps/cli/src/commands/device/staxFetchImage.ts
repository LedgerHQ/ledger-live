/* eslint-disable no-console */
import { from } from "rxjs";
import fs from "fs";
import type { ScanCommonOpts } from "../../scan";
import { deviceOpt } from "../../scan";
import staxFetchImage from "@ledgerhq/live-common/hw/staxFetchImage";
import {
  isCustomLockScreenSupported,
  CLSSupportedDeviceModelId,
} from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";

type staxFetchImageJobOpts = ScanCommonOpts & {
  fileOutput: string;
  deviceModelId: string;
};

const exec = async (opts: staxFetchImageJobOpts) => {
  const { device: deviceId = "", fileOutput, deviceModelId } = opts;
  const clsSupportedDeviceModelId = deviceModelId as CLSSupportedDeviceModelId;
  if (!isCustomLockScreenSupported(clsSupportedDeviceModelId)) {
    console.error("This device model does not support custom lock screen");
    return;
  }
  await new Promise<void>(p =>
    staxFetchImage({
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
  description: "Test functionality lock screen customization on Stax for fetching an image",
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
  job: (opts: staxFetchImageJobOpts): any => from(exec(opts)),
};
