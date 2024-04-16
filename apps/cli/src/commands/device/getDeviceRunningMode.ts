import { Observable } from "rxjs";
import {
  getDeviceRunningMode,
  GetDeviceRunningModeResult,
} from "@ledgerhq/live-common/hw/getDeviceRunningMode";
import { deviceOpt } from "../../scan";

export default {
  description:
    "Get the mode (bootloader, main, locked-device, disconnected-or-locked-device) in which the device is",
  args: [
    {
      name: "nbUnresponsiveRetry",
      alias: "r",
      desc: "Number of received CantOpenDevice errors while retrying before considering the device as maybe disconnected or cold-started-locked",
      type: Number,
    },
    {
      name: "unresponsiveTimeoutMs",
      alias: "t",
      desc: "Time in ms of the timeout before considering the device unresponsive",
      type: Number,
    },
    deviceOpt,
  ],
  job: ({
    device,
    unresponsiveTimeoutMs,
    cantOpenDeviceRetryLimit,
  }: Partial<{
    device: string;
    unresponsiveTimeoutMs: number;
    cantOpenDeviceRetryLimit: number;
  }>): Observable<GetDeviceRunningModeResult | null> =>
    getDeviceRunningMode({
      deviceId: device ?? "",
      unresponsiveTimeoutMs,
      cantOpenDeviceRetryLimit,
    }),
};
