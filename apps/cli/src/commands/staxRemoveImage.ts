import { from } from "rxjs";
import type { ScanCommonOpts } from "../scan";
import { command as staxRemoveImage } from "@ledgerhq/live-common/hw/staxRemoveImage";
import { deviceOpt } from "../scan";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";

export default {
  description: "Remove custom lock screen",
  args: [deviceOpt],
  job: (arg: ScanCommonOpts): any => withDevice(arg?.device || "")(t => from(staxRemoveImage(t))),
};
