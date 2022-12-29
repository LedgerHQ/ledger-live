import { Observable, throwError } from "rxjs";
import URL from "url";
import Transport, { TransportStatusError } from "@ledgerhq/hw-transport";
import type { OsuFirmware } from "@ledgerhq/types-live";
import type { DeviceInfo, SocketEvent } from "@ledgerhq/types-live";
import { version as livecommonversion } from "../../../package.json";
import { getEnv } from "../../env";
import {
  createMockSocket,
  bulkSocketMock,
  secureChannelMock,
} from "../../api/socket.mock";
import { log } from "@ledgerhq/logs";
import { createDeviceSocket } from "../../api/socket";
import { catchError, map } from "rxjs/operators";
import {
  ManagerFirmwareNotEnoughSpaceError,
  UserRefusedFirmwareUpdate,
  DeviceOnDashboardExpected,
} from "@ledgerhq/errors";

export type InstallOsuFirmwareCommandRequest = {
  targetId: DeviceInfo["targetId"];
  osuFirmware: OsuFirmware;
};

// TODO: update SocketEvent as a generic so we can type the result payload
// TODO: should the mapping into more meaningful events be done here or at the task level?
export type InstallOsuFirmwareCommandEvent = SocketEvent;

export function installOsuFirmwareCommand(
  transport: Transport,
  { targetId, osuFirmware }: InstallOsuFirmwareCommandRequest
): Observable<InstallOsuFirmwareCommandEvent> {
  if (getEnv("MOCK")) {
    return createMockSocket(secureChannelMock(true), bulkSocketMock(3000));
  }

  log("device-command", "installOsuFirmware", {
    targetId,
    osuFirmware,
  });

  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/install`,
      query: {
        targetId,
        livecommonversion,
        perso: osuFirmware.perso,
        firmware: osuFirmware.firmware,
        firmwareKey: osuFirmware.firmware_key,
      },
    }),
  }).pipe(
    catchError(remapSocketFirmwareError),
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

const remapSocketFirmwareError: (
  e: Error
) => Observable<InstallOsuFirmwareCommandEvent> = (e: Error) => {
  if (!e || !e.message) return throwError(e);

  if (e.message.startsWith("invalid literal")) {
    // hack to detect the case you're not in good condition (not in dashboard)
    return throwError(new DeviceOnDashboardExpected());
  }

  const status =
    e instanceof TransportStatusError
      ? // @ts-expect-error TransportStatusError to be typed on ledgerjs
        e.statusCode.toString(16)
      : (e as Error).message.slice((e as Error).message.length - 4);

  switch (status) {
    case "6a84":
    case "5103":
      return throwError(new ManagerFirmwareNotEnoughSpaceError());

    case "6a85":
    case "5102":
      return throwError(new UserRefusedFirmwareUpdate());

    case "6985":
    case "5501":
      return throwError(new UserRefusedFirmwareUpdate());

    default:
      return throwError(e);
  }
};
