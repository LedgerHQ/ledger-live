// @flow

import { from, of, concat } from "rxjs";
import { mergeMap } from "rxjs/operators";
import manager from "@ledgerhq/live-common/lib/manager";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import prepareFirmwareUpdate from "@ledgerhq/live-common/lib/hw/firmwareUpdate-prepare";
import mainFirmwareUpdate from "@ledgerhq/live-common/lib/hw/firmwareUpdate-main";
import { deviceOpt } from "../scan";

export default {
  description: "Perform a firmware update",
  args: [deviceOpt],
  job: ({ device }: $Shape<{ device: string }>) =>
    withDevice(device || "")(t => from(getDeviceInfo(t))).pipe(
      mergeMap(manager.getLatestFirmwareForDevice),
      mergeMap(firmware => {
        if (!firmware) return of("already up to date");
        return concat(
          of(
            `firmware: ${firmware.final.name}\nOSU: ${firmware.osu.name} (hash: ${firmware.osu.hash})`
          ),
          prepareFirmwareUpdate("", firmware),
          mainFirmwareUpdate("", firmware)
        );
      })
    )
};
