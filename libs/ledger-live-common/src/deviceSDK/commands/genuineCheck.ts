import { Observable } from "rxjs";
import URL from "url";
import Transport from "@ledgerhq/hw-transport";
import type { DeviceInfo, SocketEvent } from "@ledgerhq/types-live";
import { version as livecommonversion } from "../../../package.json";
import { getEnv } from "../../env";
import {
  createMockSocket,
  resultMock,
  secureChannelMock,
} from "../../api/socket.mock";
import { log } from "@ledgerhq/logs";
import { createDeviceSocket } from "../../api/socket";
import { map } from "rxjs/operators";

export type GenuineCheckCommandRequest = {
  targetId: DeviceInfo["targetId"];
  perso: any; // TODO: to type
};

// TODO: update SocketEvent as a generic so we can type the result payload
export type GenuineCheckCommandEvent = SocketEvent;

export function genuineCheckCommand(
  transport: Transport,
  { targetId, perso }: GenuineCheckCommandRequest
): Observable<GenuineCheckCommandEvent> {
  if (getEnv("MOCK")) {
    return createMockSocket(secureChannelMock(false), resultMock("0000"));
  }

  log("device-command", "genuineCheck", {
    targetId,
    perso,
  });

  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/genuine`,
      query: {
        targetId,
        perso,
        livecommonversion,
      },
    }),
  }).pipe(
    map((e) => {
      if (e.type === "result") {
        return {
          type: "result",
          payload: String(e.payload || ""),
        };
      }

      return e;
    })
  );
}
