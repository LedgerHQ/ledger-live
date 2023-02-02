/* eslint-disable no-console */
import { from } from "rxjs";
import fs from "fs";
import type { ScanCommonOpts } from "../scan";
import { deviceOpt } from "../scan";
import staxFetchImage from "@ledgerhq/live-common/hw/staxFetchImage";

type staxFetchImageJobOpts = ScanCommonOpts & {
  fileOutput: string;
};

const exec = async (opts: staxFetchImageJobOpts) => {
  const { device: deviceId = "", fileOutput } = opts;

  await new Promise<void>((p) =>
    staxFetchImage({ deviceId }).subscribe(
      (event) => {
        if (event.type === "imageFetched") {
          const { hexImage } = event;
          if (!fileOutput) {
            console.log(hexImage)
          } else {
            fs.writeFileSync(fileOutput, hexImage);
            console.log(`${fileOutput} written`);
          }
        } else {
          console.log(event);
        }
      },
      (e) => {
        console.error(e);
        p();
      },
      () => {
        console.log(`Image fetched.`);
        p();
      }
    )
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
  ],
  job: (opts: staxFetchImageJobOpts): any => from(exec(opts)),
};
