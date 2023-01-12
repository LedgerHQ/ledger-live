import { Observable, of, throwError } from "rxjs";
import URL from "url";
import Transport, { TransportStatusError } from "@ledgerhq/hw-transport";
import type { FinalFirmware, OsuFirmware } from "@ledgerhq/types-live";
import type { DeviceInfo, SocketEvent } from "@ledgerhq/types-live";
import { version as livecommonversion } from "../../../../package.json";
import { getEnv } from "../../../env";
//import { createMockSocket, bulkSocketMock, secureChannelMock } from "../../api/socket.mock";
import { log } from "@ledgerhq/logs";
import { createDeviceSocket } from "../../../api/socket";
import { catchError, filter, map } from "rxjs/operators";
import {
  ManagerFirmwareNotEnoughSpaceError,
  UserRefusedFirmwareUpdate,
  DeviceOnDashboardExpected,
  ManagerDeviceLockedError,
} from "@ledgerhq/errors";
import { UnresponsiveCmdEvent } from "../core";

export type InstallFirmwareCommandRequest = {
  targetId: DeviceInfo["targetId"];
  firmware: OsuFirmware | FinalFirmware;
};

type FilteredSocketEvent =
  | {
      type: "bulk-progress";
      progress: number;
      index: number;
      total: number;
    }
  | {
      type: "device-permission-requested";
      wording: string;
    };

export type InstallFirmwareCommandEvent =
  | {
      type: "progress";
      progress: number;
    }
  | {
      type: "allowManagerRequested";
    }
  | {
      type: "firmwareInstallPermissionRequested";
    }
  | {
      type: "firmwareInstallPermissionGranted";
    }
  | UnresponsiveCmdEvent;

export function installFirmwareCommand(
  transport: Transport,
  { targetId, firmware }: InstallFirmwareCommandRequest
): Observable<InstallFirmwareCommandEvent> {
  // TODO handle mock

  log("device-command", "installOsuFirmware", {
    targetId,
    osuFirmware: firmware,
  });

  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/install`,
      query: {
        targetId,
        livecommonversion,
        perso: firmware.perso,
        firmware: firmware.firmware,
        firmwareKey: firmware.firmware_key,
      },
    }),
  }).pipe(
    catchError(remapSocketFirmwareError),
    filter<SocketEvent, FilteredSocketEvent>((e): e is FilteredSocketEvent => {
      return (
        e.type === "bulk-progress" || e.type === "device-permission-requested"
      );
    }),
    map<FilteredSocketEvent, InstallFirmwareCommandEvent>((e) => {
      if (e.type === "bulk-progress") {
        return e.index === e.total - 1
          ? {
              type: "firmwareInstallPermissionRequested",
            }
          : e.index === e.total
          ? {
              type: "firmwareInstallPermissionGranted",
            }
          : {
              type: "progress",
              progress: e.progress,
            };
      }
      // then type is "device-permission-requested"
      return { type: "allowManagerRequested" };
    }),
    catchError(remapSocketUnresponsiveError)
  );
}

const remapSocketUnresponsiveError: (
  e: Error
) => Observable<InstallFirmwareCommandEvent> | Observable<never> = (
  e: Error
) => {
  if (e instanceof ManagerDeviceLockedError) {
    return of({ type: "unresponsive" });
  }

  return throwError(e);
};

const remapSocketFirmwareError: (e: Error) => Observable<never> = (
  e: Error
) => {
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
