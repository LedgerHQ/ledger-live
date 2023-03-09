import { Observable } from "rxjs";
import URL from "url";
import Transport from "@ledgerhq/hw-transport";
import type { DeviceInfo, SocketEvent } from "@ledgerhq/types-live";
import { version as livecommonversion } from "../../../../package.json";
import { getEnv } from "../../../env";
import { log } from "@ledgerhq/logs";
import { createDeviceSocket } from "../../../api/socket";
import { filter, map } from "rxjs/operators";

export type FlashMcuOrBootloaderCommandRequest = {
  targetId: DeviceInfo["targetId"];
  version: string;
};

type ProgressEvent = {
  type: "bulk-progress";
  progress: number;
  index: number;
  total: number;
};

const filterProgressEvent = (e: SocketEvent): e is ProgressEvent =>
  e.type === "bulk-progress";

export type FlashMcuCommandEvent = {
  type: "progress";
  progress: number;
};

/**
 * Creates a scriptrunner connection with the /mcu API endpoint of the HSM in order to flash the MCU
 * or the Bootloader of a device (both use the same endpoint with version different parameters)
 * @param transport The transport object to contact the device
 * @param param1 The versions details of the MCU or Bootloader to be installed
 * @returns An observable that emits the events according to the progression of the firmware installation
 */
export function flashMcuOrBootloaderCommand(
  transport: Transport,
  { targetId, version }: FlashMcuOrBootloaderCommandRequest
): Observable<FlashMcuCommandEvent> {
  log("device-command", "flashMcuOrBootloader", {
    targetId,
    version,
  });

  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/mcu`,
      query: {
        targetId,
        livecommonversion,
        version,
      },
    }),
  }).pipe(
    filter<SocketEvent, ProgressEvent>(filterProgressEvent),
    map((e) => ({
      type: "progress",
      progress: e.progress,
    }))
  );
}
