/* eslint-disable no-console */
import { from } from "rxjs";
import fs from "fs";
import type { ScanCommonOpts } from "../scan";
import { deviceOpt } from "../scan";
import ftsFetchImageHash from "@ledgerhq/live-common/hw/ftsFetchImageHash";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";

export default {
  description: "Fetch the hash of the custom image",
  args: [
    deviceOpt,
  ],
  job: (arg: ScanCommonOpts): any => withDevice(arg.device || "")((t) =>
    from(
      ftsFetchImageHash(t)
    )
  ),
};
