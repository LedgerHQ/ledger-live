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
    filter((e) => e.type === "bulk-progress"),
    map(castProgressEvent),
    map((e) => ({
      type: "progress",
      progress: e.progress,
    }))
  );
}
