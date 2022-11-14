/* eslint-disable no-console */
import { from } from "rxjs";
import fs from "fs";
import type { ScanCommonOpts } from "../scan";
import { deviceOpt } from "../scan";
import ftsFetchImage from "@ledgerhq/live-common/hw/ftsFetchImage";

type ftsFetchImageJobOpts = ScanCommonOpts & {
  fileOutput: string;
};

const exec = async (opts: ftsFetchImageJobOpts) => {
  const { device: deviceId = "", fileOutput } = opts;

  await new Promise<void>((p) =>
    ftsFetchImage({ deviceId }).subscribe(
      (event) => {
        if (event.type === "imageFetched") {
          const { hexImage } = event;

          fs.writeFileSync(fileOutput, hexImage);
          console.log(`${fileOutput} written`);
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
  description: "Test functionality lock screen customization on FTS for fetching an image",
  args: [
    deviceOpt,
    {
      name: "fileOutput",
      alias: "o",
      type: String,
      desc: "Output file path in case you want to save Hex string image",
    },
  ],
  job: (opts: ftsFetchImageJobOpts): any => from(exec(opts)),
};
