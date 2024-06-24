/* eslint-disable camelcase */
import {
  DeviceOnDashboardExpected,
  FirmwareNotRecognized,
  ManagerAppAlreadyInstalledError,
  ManagerDeviceLockedError,
  ManagerFirmwareNotEnoughSpaceError,
  ManagerNotEnoughSpaceError,
  NetworkDown,
  TransportStatusError,
  UserRefusedFirmwareUpdate,
} from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import {
  Application,
  ApplicationVersion,
  Category,
  DeviceInfo,
  DeviceVersion,
  FinalFirmware,
  Id,
  LanguagePackage,
  LanguagePackageResponse,
  McuVersion,
  OsuFirmware,
  SocketEvent,
} from "@ledgerhq/types-live";
import invariant from "invariant";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import semver from "semver";
import URL from "url";
import { version as livecommonversion } from "../../package.json";
import { getEnv } from "@ledgerhq/live-env";
import { createDeviceSocket } from "../socket";
import {
  bulkSocketMock,
  createMockSocket,
  resultMock,
  secureChannelMock,
} from "../socket/socket.mock";
import { getProviderId } from "./provider";
import { fetchMcusUseCase } from "../device/use-cases/fetchMcusUseCase";

declare global {
  namespace NodeJS {
    interface Global {
      _listInstalledApps_mock_result: any;
    }
  }
}

const remapSocketError = (context?: string) =>
  catchError((e: Error) => {
    if (!e || !e.message) return throwError(() => e);

    if (e.message.startsWith("invalid literal")) {
      // hack to detect the case you're not in good condition (not in dashboard)
      return throwError(() => new DeviceOnDashboardExpected());
    }

    const status =
      e instanceof TransportStatusError
        ? e.statusCode.toString(16)
        : (e as Error).message.slice((e as Error).message.length - 4);

    // TODO use StatusCode instead of this.
    switch (status) {
      case "6a80":
      case "6a81":
      case "6a8e":
      case "6a8f":
        return throwError(() => new ManagerAppAlreadyInstalledError());

      case "6982":
      case "5303":
        return throwError(() => new ManagerDeviceLockedError());

      case "6a84":
      case "5103":
        if (context === "firmware" || context === "mcu") {
          return throwError(() => new ManagerFirmwareNotEnoughSpaceError());
        }

        return throwError(() => new ManagerNotEnoughSpaceError());

      case "6a85":
      case "5102":
        if (context === "firmware" || context === "mcu") {
          return throwError(() => new UserRefusedFirmwareUpdate());
        }

        return throwError(() => new ManagerNotEnoughSpaceError());

      case "6985":
      case "5501":
        if (context === "firmware" || context === "mcu") {
          return throwError(() => new UserRefusedFirmwareUpdate());
        }

        return throwError(() => new ManagerNotEnoughSpaceError());

      default:
        return throwError(() => e);
    }
  });

/** @deprecated use getAppsCatalogForDevice (from ledger-live-common/src/device/use-cases) instead */
const applicationsByDevice: (params: {
  provider: number;
  current_se_firmware_final_version: Id;
  device_version: Id;
}) => Promise<Array<ApplicationVersion>> = makeLRUCache(
  async params => {
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
  p =>
    `${getEnv("MANAGER_API_BASE")}_${p.provider}_${p.current_se_firmware_final_version}_${
      p.device_version
    }`,
);

/** @deprecated use getAppsCatalogForDevice (from ledger-live-common/src/device/use-cases) instead */
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
  () => getEnv("MANAGER_API_BASE"),
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

const compatibleMCUForDeviceInfo = (
  mcus: McuVersion[],
  deviceInfo: DeviceInfo,
  provider: number,
): McuVersion[] =>
  mcus.filter(
    m =>
      (deviceInfo.majMin === m.from_bootloader_version ||
        deviceInfo.version === m.from_bootloader_version) &&
      m.providers.includes(provider),
  );

const findBestMCU = (compatibleMCU: McuVersion[]): McuVersion | undefined => {
  let best = compatibleMCU[0];

  for (let i = 1; i < compatibleMCU.length; i++) {
    if (semver.gt(semver.coerce(compatibleMCU[i].name) || "", semver.coerce(best.name) || "")) {
      best = compatibleMCU[i];
    }
  }

  return best;
};

const getLanguagePackagesForDevice = async (deviceInfo: DeviceInfo): Promise<LanguagePackage[]> => {
  const deviceVersion = await getDeviceVersion(deviceInfo.targetId, getProviderId(deviceInfo));

  const seFirmwareVersion = await getCurrentFirmware({
    version: deviceInfo.version,
    deviceId: deviceVersion.id,
    provider: getProviderId(deviceInfo),
  });

  const { data }: { data: LanguagePackageResponse[] } = await network({
    method: "GET",
    url: URL.format({
      pathname: `${getEnv("MANAGER_API_BASE")}/language-package`,
      query: {
        livecommonversion,
      },
    }),
  });

  const allPackages: LanguagePackage[] = data.reduce(
    (acc, response) => [
      ...acc,
      ...response.language_package_version.map(p => ({
        ...p,
        language: response.language,
      })),
    ],
    [] as LanguagePackage[],
  );

  const packages = allPackages.filter(
    pack =>
      pack.device_versions.includes(deviceVersion.id) &&
      pack.se_firmware_final_versions.includes(seFirmwareVersion.id),
  );

  return packages;
};

const getCurrentOSU: (input: {
  version: string;
  deviceId: string | number;
  provider: number;
}) => Promise<OsuFirmware> = makeLRUCache(
  async input => {
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
  a => `${getEnv("MANAGER_API_BASE")}_${a.version}_${a.deviceId}_${a.provider}`,
);
const getCurrentFirmware: (input: {
  version: string;
  deviceId: string | number;
  provider: number;
}) => Promise<FinalFirmware> = makeLRUCache(
  async input => {
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
    }).catch(error => {
      const status = error?.status || error?.response?.status;

      if (status === 404) throw new FirmwareNotRecognized();

      throw error;
    });
    return data;
  },
  a => `${getEnv("MANAGER_API_BASE")}_${a.version}_${a.deviceId}_${a.provider}`,
);
const getFinalFirmwareById: (id: number) => Promise<FinalFirmware> = makeLRUCache(
  async id => {
    const {
      data,
    }: {
      data: FinalFirmware;
    } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${getEnv("MANAGER_API_BASE")}/firmware_final_versions/${id}`,
        query: {
          livecommonversion,
        },
      }),
    });
    return data;
  },
  id => `${getEnv("MANAGER_API_BASE")}}_${String(id)}`,
);

const getDeviceVersion: (targetId: string | number, provider: number) => Promise<DeviceVersion> =
  makeLRUCache(
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
      }).catch(error => {
        const status = error?.status || error?.response?.status;

        if (status === 404)
          throw new FirmwareNotRecognized("manager api did not recognize targetId=" + targetId, {
            targetId,
          });

        throw error;
      });
      return data;
    },
    (targetId, provider) => `${getEnv("MANAGER_API_BASE")}_${targetId}_${provider}`,
  );

const install = (
  transport: Transport,
  context: string,
  params: any,
  unresponsiveExpectedDuringBulk?: boolean,
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
  },
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
    map(e => {
      if (e.type === "result") {
        return {
          type: "result",
          payload: String(e.payload || ""),
        };
      }

      return e;
    }),
  );
};

export type ListInstalledAppsEvent =
  | SocketEvent
  | {
      type: "result";
      payload: Array<{
        hash: string;
        name: string;
        hash_code_data?: string;
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
  },
): Observable<ListInstalledAppsEvent> => {
  if (getEnv("MOCK")) {
    const result = global._listInstalledApps_mock_result;
    invariant(result, "using MOCK, global._listInstalledApps_mock_result must be set");
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
    map<any, ListInstalledAppsEvent>(o => {
      if (o.type === "result") {
        return {
          type: "result",
          payload: [...o.payload].map(a => {
            invariant(typeof a === "object" && a, "payload array item are objects");
            const { hash, name, hash_code_data } = a;
            invariant(typeof hash === "string", "hash is defined");
            invariant(typeof name === "string", "name is defined");
            return {
              hash,
              name,
              hash_code_data,
            };
          }),
        };
      }

      return o;
    }),
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
  },
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

async function retrieveMcuVersion({
  mcu_versions,
}: FinalFirmware): Promise<McuVersion | undefined> {
  const mcus = await fetchMcusUseCase();
  const provider = getProviderId(undefined);
  const availableMcus = mcus.filter(
    ({ id, providers, from_bootloader_version }: McuVersion) =>
      providers.includes(provider) &&
      from_bootloader_version !== "none" &&
      mcu_versions.includes(id),
  );
  return findBestMCU(availableMcus);
}

const API = {
  /** @deprecated use getAppsCatalogForDevice (from ledger-live-common/src/device/use-cases) instead */
  applicationsByDevice,
  /** @deprecated use getAppsCatalogForDevice (from ledger-live-common/src/device/use-cases) instead */
  listApps,
  listInstalledApps,
  listCategories,
  getLanguagePackagesForDevice,
  getCurrentOSU,
  compatibleMCUForDeviceInfo,
  findBestMCU,
  getCurrentFirmware,
  getFinalFirmwareById,
  getDeviceVersion,
  install,
  genuineCheck,
  installMcu,
  retrieveMcuVersion,
};
export default API;
