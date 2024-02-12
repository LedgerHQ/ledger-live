/* eslint-disable no-console */
import { firstValueFrom, from } from "rxjs";
import fs from "fs";
import type { ScanCommonOpts } from "../scan";
import { deviceOpt } from "../scan";
import staxFetchImageHash from "@ledgerhq/live-common/hw/staxFetchImageHash";
import staxLoadImage, { generateStaxImageFormat } from "@ledgerhq/live-common/hw/staxLoadImage";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import crypto from "crypto";

/**
 * This is an implmentation demo of what we will have during a firmware update
 * where an image will be backed up _only_ if the hash we have is the cached
 * version we have is different from the one on the device. This would speed up
 * the flow if the user hasn't changed the image since the last time we backed it.
 */

type staxFetchAndRestoreJobOpts = ScanCommonOpts & {
  fileInput: string;
};

const exec = async (opts: staxFetchAndRestoreJobOpts) => {
  const { fileInput, device: deviceId = "" } = opts;
  const hexImageWithoutHeader = fs.readFileSync(fileInput, "utf-8");
  const hexImage = await generateStaxImageFormat(hexImageWithoutHeader, true, true);

  // TODO: rework without double resolving promise
  // eslint-disable-next-line
  await new Promise<void>(async () => {
    const hash = crypto.createHash("sha256").update(hexImage).digest("hex");
    console.log("Computing hash for input file");
    console.log(hash);
    console.log("Extracting hash from device");

    const currentHash = await firstValueFrom(
      withDevice(deviceId)(t => from(staxFetchImageHash(t))),
    );
    if (currentHash === hash) {
      console.log("Hashes match, skip backup step because we can use the one we have");
    } else {
      console.log("Hashes don't match, fetch image before updating");
    }

    console.log("Delete the current image (simulate the wipe from fw update)");
    await firstValueFrom(
      withDevice(deviceId)(t => from(t.exchange(Buffer.from("e063000000", "hex")))),
    );

    console.log("Restoring the image we backedup");
    await new Promise<void>(resolve =>
      staxLoadImage({ deviceId, request: { hexImage: hexImageWithoutHeader } }).subscribe(
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
  });
};

export default {
  description: "Conditionally backup, delete, and restore a custom image on Stax",
  args: [
    deviceOpt,
    {
      name: "fileInput",
      alias: "i",
      type: String,
      desc: "Text file containing the hex data of the image to load on Stax",
    },
  ],
  job: (opts: staxFetchAndRestoreJobOpts): any => from(exec(opts)),
};
