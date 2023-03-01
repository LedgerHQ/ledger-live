import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { from } from "rxjs";

import Eth from "../../../../libs/ledgerjs/packages/hw-app-eth";

export default {
  description: "Generates a random 32-bit long value and return it.",
  args: [],
  job: ({
    device,
  }: Partial<{
    device: string;
    unresponsiveTimeoutMs: number;
    cantOpenDeviceRetryLimit: number;
  }>): any => {
    return withDevice(device || "")((transport) => {
      const eth = new Eth(transport);
      return from(eth.getChallenge());
    });
  },
};
