import repairFirmwareUpdate from "@ledgerhq/live-common/lib/hw/firmwareUpdate-repair";
import { deviceOpt } from "../scan";
export default {
  description: "Repair a firmware update",
  args: [
    deviceOpt,
    {
      name: "forceMCU",
      type: String,
      desc: "force a mcu version to install",
    },
  ],
  job: ({
    device,
    forceMCU,
  }: Partial<{
    device: string;
    forceMCU: string;
  }>) => repairFirmwareUpdate(device || "", forceMCU),
};
