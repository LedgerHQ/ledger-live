/* eslint-disable camelcase */
import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import URL from "url";
import {
  DeviceOnDashboardExpected,
  ManagerAppAlreadyInstalledError,
  ManagerDeviceLockedError,
  ManagerFirmwareNotEnoughSpaceError,
  ManagerNotEnoughSpaceError,
  UserRefusedFirmwareUpdate,
  NetworkDown,
  FirmwareNotRecognized,
  TransportStatusError,
} from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import { throwError, Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { version as livecommonversion } from "../../package.json";
import { createDeviceSocket } from "./socket";
import {
  createMockSocket,
  bulkSocketMock,
  secureChannelMock,
  resultMock,
} from "./socket.mock";
import semver from "semver";
import type { DeviceInfo, McuVersion, SocketEvent } from "../types/manager";
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
} from "../types/manager";
import { makeLRUCache } from "../cache";
import { getUserHashes } from "../user";
import { LanguagePackage } from "../types/languages";

declare global {
  namespace NodeJS {
    interface Global {
      _listInstalledApps_mock_result: any;
    }
  }
}

const remapSocketError = (context?: string) =>
  catchError((e: Error) => {
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
      case "6a80":
      case "6a81":
      case "6a8e":
      case "6a8f":
        return throwError(new ManagerAppAlreadyInstalledError());

      case "6982":
      case "5303":
        return throwError(new ManagerDeviceLockedError());

      case "6a84":
      case "5103":
        if (context === "firmware" || context === "mcu") {
          return throwError(new ManagerFirmwareNotEnoughSpaceError());
        }

        return throwError(new ManagerNotEnoughSpaceError());

      case "6a85":
      case "5102":
        if (context === "firmware" || context === "mcu") {
          return throwError(new UserRefusedFirmwareUpdate());
        }

        return throwError(new ManagerNotEnoughSpaceError());

      case "6985":
      case "5501":
        if (context === "firmware" || context === "mcu") {
          return throwError(new UserRefusedFirmwareUpdate());
        }

        return throwError(new ManagerNotEnoughSpaceError());

      default:
        return throwError(e);
    }
  });

const applicationsByDevice: (params: {
  provider: number;
  current_se_firmware_final_version: Id;
  device_version: Id;
}) => Promise<Array<ApplicationVersion>> = makeLRUCache(
  async (params) => {
    const r = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_apps`,
        query: {
          livecommonversion,
        },
      }),
      data: params,
    });
    return r.data.application_versions;
  },
  (p) =>
    `${p.provider}_${p.current_se_firmware_final_version}_${p.device_version}`
);
const listApps: () => Promise<Array<Application>> = makeLRUCache(
  async () => {
    const { data } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/applications`,
        query: {
          livecommonversion,
        },
      }),
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
      query: {
        livecommonversion,
      },
    }),
  });
  return r.data;
};

const getMcus: () => Promise<any> = makeLRUCache(
  async () => {
    const { data } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/mcu_versions`,
        query: {
          livecommonversion,
        },
      }),
    });
    return data;
  },
  () => ""
);

const compatibleMCUForDeviceInfo = (
  mcus: McuVersion[],
  deviceInfo: DeviceInfo,
  provider: number
): McuVersion[] =>
  mcus.filter(
    (m) =>
      (deviceInfo.majMin === m.from_bootloader_version ||
        deviceInfo.version === m.from_bootloader_version) &&
      m.providers.includes(provider)
  );

const findBestMCU = (compatibleMCU: McuVersion[]): McuVersion | undefined => {
  let best = compatibleMCU[0];

  for (let i = 1; i < compatibleMCU.length; i++) {
    if (
      semver.gt(
        semver.coerce(compatibleMCU[i].name) || "",
        semver.coerce(best.name) || ""
      )
    ) {
      best = compatibleMCU[i];
    }
  }

  return best;
};

const getLanguagePackages = async (
  device_version: number,
  current_se_firmware_final_version: number
): Promise<LanguagePackage[]> => {
  console.log({ device_version, current_se_firmware_final_version });
  const { data }: { data: LanguagePackage[] } = await network({
    method: "POST",
    url: URL.format({
      // TODO use the production key 
      pathname: `https://appstore.api.aws.stg.ldg-tech.com//api/language-packages`,
      query: {
        livecommonversion,
      },
    }),
    data: {
      device_version,
      current_se_firmware_final_version,
    },
  });
  return data;
};

const getLatestFirmware: (arg0: {
  current_se_firmware_final_version: Id;
  device_version: Id;
  provider: number;
}) => Promise<OsuFirmware | null | undefined> = makeLRUCache(
  async ({ current_se_firmware_final_version, device_version, provider }) => {
    const salt = getUserHashes().firmwareSalt;
    const {
      data,
    }: {
      data: {
        result: string;
        se_firmware_osu_version: OsuFirmware;
      };
    } = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_latest_firmware`,
        query: {
          livecommonversion,
          salt,
        },
      }),
      data: {
        current_se_firmware_final_version,
        device_version,
        provider,
      },
    });

    if (data.result === "null") {
      return null;
    }

    return data.se_firmware_osu_version;
  },
  (a) =>
    `${a.current_se_firmware_final_version}_${a.device_version}_${a.provider}`
);
const getCurrentOSU: (input: {
  version: string;
  deviceId: string | number;
  provider: number;
}) => Promise<OsuFirmware> = makeLRUCache(
  async (input) => {
    const { data } = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_osu_version`,
        query: {
          livecommonversion,
        },
      }),
      data: {
        device_version: input.deviceId,
        version_name: `${input.version}-osu`,
        provider: input.provider,
      },
    });
    return data;
  },
  (a) => `${a.version}_${a.deviceId}_${a.provider}`
);
const getCurrentFirmware: (input: {
  version: string;
  deviceId: string | number;
  provider: number;
}) => Promise<FinalFirmware> = makeLRUCache(
  async (input) => {
    const {
      data,
    }: {
      data: FinalFirmware;
    } = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_firmware_version`,
        query: {
          livecommonversion,
        },
      }),
      data: {
        device_version: input.deviceId,
        version_name: input.version,
        provider: input.provider,
      },
    });
    return data;
  },
  (a) => `${a.version}_${a.deviceId}_${a.provider}`
);
const getFinalFirmwareById: (id: number) => Promise<FinalFirmware> =
  makeLRUCache(
    async (id) => {
      const {
        data,
      }: {
        data: FinalFirmware;
      } = await network({
        method: "GET",
        url: URL.format({
          pathname: `${getEnv(
            "MANAGER_API_BASE"
          )}/firmware_final_versions/${id}`,
          query: {
            livecommonversion,
          },
        }),
      });
      return data;
    },
    (id) => String(id)
  );
const getDeviceVersion: (
  targetId: string | number,
  provider: number
) => Promise<DeviceVersion> = makeLRUCache(
  async (targetId, provider) => {
    const {
      data,
    }: {
      data: DeviceVersion;
    } = await network({
      method: "POST",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/get_device_version`,
        query: {
          livecommonversion,
        },
      }),
      data: {
        provider,
        target_id: targetId,
      },
    }).catch((error) => {
      const status = // FIXME LLD is doing error remapping already. we probably need to move the remapping in live-common
        error && (error.status || (error.response && error.response.status));

      if (status === 404) {
        throw new FirmwareNotRecognized(
          "manager api did not recognize targetId=" + targetId,
          {
            targetId,
          }
        );
      }

      throw error;
    });
    return data;
  },
  (targetId, provider) => `${targetId}_${provider}`
);

const install = (
  transport: Transport,
  context: string,
  params: any,
  unresponsiveExpectedDuringBulk?: boolean
): Observable<any> => {
  if (getEnv("MOCK")) {
    return createMockSocket(secureChannelMock(true), bulkSocketMock(3000));
  }

  log("manager", "install " + context, params);
  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/install`,
      query: { ...params, livecommonversion },
    }),
    unresponsiveExpectedDuringBulk,
  }).pipe(remapSocketError(context));
};

const genuineCheck = (
  transport: Transport,
  {
    targetId,
    perso,
  }: {
    targetId: any;
    perso: any;
  }
): Observable<any> => {
  if (getEnv("MOCK")) {
    return createMockSocket(secureChannelMock(false), resultMock("0000"));
  }

  log("manager", "genuineCheck", {
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
};

export type ListInstalledAppsEvent =
  | SocketEvent
  | {
      type: "result";
      payload: Array<{
        hash: string;
        name: string;
      }>;
    };

const listInstalledApps = (
  transport: Transport,
  {
    targetId,
    perso,
  }: {
    targetId: any;
    perso: any;
  }
): Observable<ListInstalledAppsEvent> => {
  if (getEnv("MOCK")) {
    const result = global._listInstalledApps_mock_result;
    invariant(
      result,
      "using MOCK, global._listInstalledApps_mock_result must be set"
    );
    return createMockSocket(secureChannelMock(false), resultMock(result));
  }

  log("manager", "listInstalledApps", {
    targetId,
    perso,
  });
  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/apps/list`,
      query: {
        targetId,
        perso,
        livecommonversion,
      },
    }),
  }).pipe(
    remapSocketError("listInstalledApps"),
    map<any, ListInstalledAppsEvent>((o) => {
      if (o.type === "result") {
        return {
          type: "result",
          payload: [...o.payload].map((a) => {
            invariant(
              typeof a === "object" && a,
              "payload array item are objects"
            );
            const { hash, name } = a;
            invariant(typeof hash === "string", "hash is defined");
            invariant(typeof name === "string", "name is defined");
            return {
              hash,
              name,
            };
          }),
        };
      }

      return o;
    })
  );
};

const installMcu = (
  transport: Transport,
  context: string,
  {
    targetId,
    version,
  }: {
    targetId: number | string;
    version: string;
  }
): Observable<any> => {
  if (getEnv("MOCK")) {
    return createMockSocket(secureChannelMock(false), bulkSocketMock(5000));
  }

  log("manager", "installMCU " + context, {
    targetId,
    version,
  });

  return createDeviceSocket(transport, {
    url: URL.format({
      pathname: `${getEnv("BASE_SOCKET_URL")}/mcu`,
      query: {
        targetId,
        version,
        livecommonversion,
      },
    }),
    unresponsiveExpectedDuringBulk: true,
  }).pipe(remapSocketError(context));
};

const API = {
  applicationsByDevice,
  listApps,
  listInstalledApps,
  listCategories,
  getMcus,
  getLanguagePackages,
  getLatestFirmware,
  getCurrentOSU,
  compatibleMCUForDeviceInfo,
  findBestMCU,
  getCurrentFirmware,
  getFinalFirmwareById,
  getDeviceVersion,
  install,
  genuineCheck,
  installMcu,
};
export default API;
