import { Observable } from "rxjs";
import URL from "url";
import Transport from "@ledgerhq/hw-transport";
import type { McuVersion } from "@ledgerhq/types-live";
import type { DeviceInfo, SocketEvent } from "@ledgerhq/types-live";
import { version as livecommonversion } from "../../../../package.json";
import { getEnv } from "../../../env";
import { log } from "@ledgerhq/logs";
import { createDeviceSocket } from "../../../api/socket";
import { filter, map } from "rxjs/operators";

export type FlashMcuCommandRequest = {
  targetId: DeviceInfo["targetId"];
  mcuVersion: McuVersion;
};

const castProgressEvent = (e: SocketEvent) =>
  e as {
    type: "bulk-progress";
    progress: number;
    index: number;
    total: number;
  };

export type FlashMcuCommandEvent = {
  type: "progress";
  progress: number;
};

export function installOsuFirmwareCommand(
  transport: Transport,
  { targetId, mcuVersion }: FlashMcuCommandRequest
): Observable<FlashMcuCommandEvent> {
  log("device-command", "flashMcu", {
    targetId,
    mcuVersion,
  });

  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/mcu`,
      query: {
        targetId,
        livecommonversion,
        version: mcuVersion.name,
      },
    }),
  }).pipe(
    filter((e) => e.type === "bulk-progress"),
    map(castProgressEvent),
    map((e) => ({
      type: "progress",
      progress: e.progress,
    }))
  );
}
