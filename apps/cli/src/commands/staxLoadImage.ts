import { from } from "rxjs";
import fs from "fs";
import type { ScanCommonOpts } from "../scan";
import staxLoadImage from "@ledgerhq/live-common/hw/staxLoadImage";
import { deviceOpt } from "../scan";

type staxLoadImageJobOpts = ScanCommonOpts & {
  fileInput: string;
};


const exec = async (opts: staxLoadImageJobOpts) => {
  const { fileInput, device: deviceId = "" } = opts;

  const hexImage = fs.readFileSync(fileInput, "utf-8");

  await new Promise<void>((resolve) =>
      staxLoadImage({ deviceId, hexImage }).subscribe(
        (x) => console.log(x),
        (e) => {
          console.error(e);
          resolve();
        },
        () => {
          console.log(`Image loaded.`);
          resolve();
        }
      )
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
    }
  ],
  job: (opts: staxLoadImageJobOpts): any => from(exec(opts)),
};
