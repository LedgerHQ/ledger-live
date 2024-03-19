import { from } from "rxjs";
import fs from "fs";
import type { ScanCommonOpts } from "../../scan";
import staxLoadImage from "@ledgerhq/live-common/hw/staxLoadImage";
import { deviceOpt } from "../../scan";
import {
  CLSSupportedDeviceModelId,
  isCustomLockScreenSupported,
} from "@ledgerhq/live-common/device-core/capabilities/isCustomLockScreenSupported";

type staxLoadImageJobOpts = ScanCommonOpts & {
  fileInput: string;
  deviceModelId: string;
};

const exec = async (opts: staxLoadImageJobOpts) => {
  const { fileInput, device: deviceId = "", deviceModelId } = opts;
  const clsSupportedDeviceModelId = deviceModelId as CLSSupportedDeviceModelId;
  if (!isCustomLockScreenSupported(clsSupportedDeviceModelId)) {
    console.error("This device model does not support custom lock screen");
    return;
  }

  const hexImage = fs.readFileSync(fileInput, "utf-8");

  await new Promise<void>(resolve =>
    staxLoadImage({
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
  description: "Test functionality lock screen customization on Stax for loading an image",
  args: [
    deviceOpt,
    {
      name: "fileInput",
      alias: "i",
      type: String,
      desc: "Text file containing the hex data of the image to load on Stax",
    },
    {
      name: "deviceModelId",
      type: String,
      desc: "The device model id to use",
    },
  ],
  job: (opts: staxLoadImageJobOpts): any => from(exec(opts)),
};
