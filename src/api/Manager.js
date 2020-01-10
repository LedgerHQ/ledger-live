// @flow
/* eslint-disable camelcase */

import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import URL from "url";
import {
  DeviceOnDashboardExpected,
  LatestMCUInstalledError,
  ManagerAppAlreadyInstalledError,
  ManagerDeviceLockedError,
  ManagerFirmwareNotEnoughSpaceError,
  ManagerNotEnoughSpaceError,
  UserRefusedAllowManager,
  UserRefusedFirmwareUpdate,
  NetworkDown,
  WebsocketConnectionFailed
} from "@ledgerhq/errors";
import type Transport from "@ledgerhq/hw-transport";
import { throwError, Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { version as livecommonversion } from "../../package.json";
import { createDeviceSocket } from "./socket";
import type { SocketEvent } from "./socket";
import network from "../network";
import { getEnv } from "../env";
import type {
  OsuFirmware,
  DeviceVersion,
  FinalFirmware,
  ApplicationVersion,
  Application,
  Category,
  Id,
  McuVersion,
  GenuineCheckEvent
} from "../types/manager";
import { makeLRUCache } from "../cache";
import { getUserHashes } from "../user";

const ALLOW_MANAGER_APDU_DEBOUNCE = 500;

const remapSocketError = (context?: string) =>
  catchError((e: Error) => {
    if (!e || !e.message) return throwError(e);
    if (e.message.startsWith("invalid literal")) {
      // hack to detect the case you're not in good condition (not in dashboard)
      return throwError(new DeviceOnDashboardExpected());
    }
    const status = e.message.slice(e.message.length - 4);
    switch (status) {
      case "6a80":
      case "6a81":
        return throwError(new ManagerAppAlreadyInstalledError());
      case "6982":
        return throwError(new ManagerDeviceLockedError());
      case "6a84":
        if (context === "firmware" || context === "mcu") {
          return throwError(new ManagerFirmwareNotEnoughSpaceError());
        }
        return throwError(new ManagerNotEnoughSpaceError());
      case "6a85":
        if (context === "firmware" || context === "mcu") {
          return throwError(new UserRefusedFirmwareUpdate());
        }
        return throwError(new ManagerNotEnoughSpaceError());
      case "6985":
        if (context === "firmware" || context === "mcu") {
          return throwError(new UserRefusedFirmwareUpdate());
        }
        return throwError(new ManagerNotEnoughSpaceError());
      default:
        return throwError(e);
    }
  });

const applicationsByDevice: (params: {
  provider: number,
  current_se_firmware_final_version: Id,
  device_version: Id
}) => Promise<Array<ApplicationVersion>> = makeLRUCache(
  async params => {
    const r = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_apps`,
        query: { livecommonversion }
      }),
      data: params
    });
    return r.data.application_versions;
  },
  p =>
    `${p.provider}_${p.current_se_firmware_final_version}_${p.device_version}`
);

const listApps: () => Promise<Array<Application>> = makeLRUCache(
  async () => {
    const { data } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/applications`,
        query: { livecommonversion }
      })
    });
    if (!data || !Array.isArray(data)) {
      throw new NetworkDown("");
    }
    return data;
  },
  () => ""
);

const listCategories = async (): Promise<Array<Category>> => {
  const r = await network({
    method: "GET",
    url: URL.format({
      pathname: `${getEnv("MANAGER_API_BASE")}/categories`,
      query: { livecommonversion }
    })
  });
  return r.data;
};

const getMcus: () => Promise<*> = makeLRUCache(
  async () => {
    const { data } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/mcu_versions`,
        query: { livecommonversion }
      })
    });
    return data;
  },
  () => ""
);

const getLatestFirmware: ({
  current_se_firmware_final_version: Id,
  device_version: Id,
  provider: number
}) => Promise<?OsuFirmware> = makeLRUCache(
  async ({ current_se_firmware_final_version, device_version, provider }) => {
    const salt = getUserHashes().firmwareSalt;
    const {
      data
    }: {
      data: {
        result: string,
        se_firmware_osu_version: OsuFirmware
      }
    } = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_latest_firmware`,
        query: { livecommonversion, salt }
      }),
      data: {
        current_se_firmware_final_version,
        device_version,
        provider
      }
    });
    if (data.result === "null") {
      return null;
    }
    return data.se_firmware_osu_version;
  },
  a =>
    `${a.current_se_firmware_final_version}_${a.device_version}_${a.provider}`
);

const getCurrentOSU: (input: {
  version: string,
  deviceId: string | number,
  provider: number
}) => Promise<OsuFirmware> = makeLRUCache(
  async input => {
    const { data } = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_osu_version`,
        query: { livecommonversion }
      }),
      data: {
        device_version: input.deviceId,
        version_name: `${input.version}-osu`,
        provider: input.provider
      }
    });
    return data;
  },
  a => `${a.version}_${a.deviceId}_${a.provider}`
);

const getNextBLVersion = async (
  mcuversion: string | number
): Promise<McuVersion> => {
  const { data }: { data: McuVersion | "default" } = await network({
    method: "GET",
    url: URL.format({
      pathname: `${getEnv("MANAGER_API_BASE")}/mcu_versions/${mcuversion}`,
      query: { livecommonversion }
    })
  });

  if (data === "default" || !data.name) {
    throw new LatestMCUInstalledError(
      "there is no next mcu version to install"
    );
  }

  log("firmware-update", `getNextBLVersion ${mcuversion} => ${String(data)}`);

  return data;
};

const getCurrentFirmware: (input: {
  version: string,
  deviceId: string | number,
  provider: number
}) => Promise<FinalFirmware> = makeLRUCache(
  async input => {
    const { data }: { data: FinalFirmware } = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_firmware_version`,
        query: { livecommonversion }
      }),
      data: {
        device_version: input.deviceId,
        version_name: input.version,
        provider: input.provider
      }
    });
    return data;
  },
  a => `${a.version}_${a.deviceId}_${a.provider}`
);

const getFinalFirmwareById: (
  id: number
) => Promise<FinalFirmware> = makeLRUCache(
  async id => {
    const { data }: { data: FinalFirmware } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/firmware_final_versions/${id}`,
        query: { livecommonversion }
      })
    });
    return data;
  },
  id => String(id)
);

const getDeviceVersion: (
  targetId: string | number,
  provider: number
) => Promise<DeviceVersion> = makeLRUCache(
  async (targetId, provider) => {
    const { data }: { data: DeviceVersion } = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_device_version`,
        query: { livecommonversion }
      }),
      data: {
        provider,
        target_id: targetId
      }
    });
    return data;
  },
  (targetId, provider) => `${targetId}_${provider}`
);

const install = (
  transport: Transport<*>,
  context: string,
  params: *
): Observable<*> => {
  log("manager", "install " + context, params);
  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/install`,
      query: { ...params, livecommonversion }
    }),
    ignoreWebsocketErrorDuringBulk: true
  }).pipe(remapSocketError(context));
};

export type WithAllowManagerEvent =
  | { type: "result", payload: mixed }
  | { type: "allow-manager-requested" }
  | { type: "allow-manager-accepted" };

const aggregateAllowManagerEvents = (
  input: Observable<SocketEvent>
): Observable<WithAllowManagerEvent> =>
  Observable.create(o => {
    let timeout;
    let requested;
    const sub = input.subscribe({
      complete: () => {
        o.complete();
      },
      error: e => {
        o.error(e);
      },
      next: e => {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        if (e.type === "result") {
          o.next({ type: "result", payload: e.payload });
        } else if (e.nonce === 3) {
          if (e.type === "exchange-before") {
            timeout = setTimeout(() => {
              o.next({ type: "allow-manager-requested" });
              requested = true;
            }, ALLOW_MANAGER_APDU_DEBOUNCE);
          } else if (e.type === "exchange") {
            if (e.status.toString("hex") === "6985") {
              o.error(new UserRefusedAllowManager());
              return;
            }
            if (requested) {
              o.next({ type: "allow-manager-accepted" });
            }
          }
        }
      }
    });
    return sub;
  });

const genuineCheck = (
  transport: Transport<*>,
  { targetId, perso }: { targetId: *, perso: * }
): Observable<GenuineCheckEvent> => {
  log("manager", "genuineCheck", { targetId, perso });
  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/genuine`,
      query: { targetId, perso, livecommonversion }
    })
  }).pipe(
    // $FlowFixMe
    aggregateAllowManagerEvents,
    map(e => {
      if (e.type === "result") {
        return { type: "result", payload: String(e.payload || "") };
      }
      return e;
    })
  );
};

export type ListInstalledAppsEvent =
  | { type: "result", payload: Array<{ hash: string, name: string }> }
  | { type: "allow-manager-requested" }
  | { type: "allow-manager-accepted" };

const listInstalledApps = (
  transport: Transport<*>,
  { targetId, perso }: { targetId: *, perso: * }
): Observable<ListInstalledAppsEvent> => {
  log("manager", "listInstalledApps", { targetId, perso });
  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/apps/list`,
      query: { targetId, perso, livecommonversion }
    })
  }).pipe(
    remapSocketError("listInstalledApps"),
    // $FlowFixMe
    aggregateAllowManagerEvents,
    map(o => {
      if (!o.payload) {
        throw new WebsocketConnectionFailed();
      }
      if (o.type === "result") {
        return {
          type: "result",
          payload: [...o.payload].map(a => {
            invariant(
              typeof a === "object" && a,
              "payload array item are objects"
            );
            const { hash, name } = a;
            invariant(typeof hash === "string", "hash is defined");
            invariant(typeof name === "string", "name is defined");
            return { hash, name };
          })
        };
      }
      return o;
    })
  );
};

const installMcu = (
  transport: Transport<*>,
  context: string,
  { targetId, version }: { targetId: *, version: * }
): Observable<*> => {
  log("manager", "installMCU " + context, { targetId, version });
  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/mcu`,
      query: { targetId, version, livecommonversion }
    }),
    ignoreWebsocketErrorDuringBulk: true
  }).pipe(remapSocketError(context));
};

const API = {
  applicationsByDevice,
  listApps,
  listInstalledApps,
  listCategories,
  getMcus,
  getLatestFirmware,
  getCurrentOSU,
  getNextBLVersion,
  getCurrentFirmware,
  getFinalFirmwareById,
  getDeviceVersion,
  install,
  genuineCheck,
  installMcu
};

export default API;
