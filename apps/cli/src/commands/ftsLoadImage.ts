import { from } from "rxjs";
import fs from "fs";
import type { ScanCommonOpts } from "../scan";
import ftsLoadImage from "@ledgerhq/live-common/hw/ftsLoadImage";
import { deviceOpt } from "../scan";

type ftsLoadImageJobOpts = ScanCommonOpts & {
  fileInput: string;
};


const exec = async (opts: ftsLoadImageJobOpts) => {
  const { fileInput, device: deviceId = "" } = opts;

  const hexImage = fs.readFileSync(fileInput, "utf-8");

  await new Promise<void>((p) =>
      ftsLoadImage({ deviceId, hexImage }).subscribe(
        (x) => console.log(x),
        (e) => {
          console.error(e);
          p();
        },
        () => {
          console.log(`Image loaded.`);
          p();
        }
      )
    );
};

export default {
  description: "Test functionality lock screen customization on FTS for loading an image",
  args: [
    deviceOpt,
    {
      name: "fileInput",
      alias: "i",
      type: String,
      desc: "Text file containing the base64 data of the image to load on FTS",
    }
  ],
  job: (opts: ftsLoadImageJobOpts): any => from(exec(opts)),
};
