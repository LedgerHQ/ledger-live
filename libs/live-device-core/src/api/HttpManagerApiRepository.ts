import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { FirmwareNotRecognized, NetworkDown } from "@ledgerhq/errors";
import URL from "url";

import { getUserHashes } from "../utils/getUserHash";
import { ManagerApiRepository } from "./ManagerApiRepository";
import { getProviderIdUseCase } from "./use-cases/getProviderIdUseCase";
import {
  ApplicationV2Entity,
  CatalogForDeviceOptions,
  DeviceInfoEntity,
  DeviceVersionEntity,
  FetchLatestFirmwareOptions,
  FinalFirmware,
  GetCurrentFirmwareOptions,
  GetCurrentOsuOptions,
  GetDeviceVersionOptions,
  LanguagePackageEntity,
  LanguagePackageResponseEntity,
  OsuFirmware,
  ResponseErrorType,
} from "../types";

export class HttpManagerApiRepository implements ManagerApiRepository {
  private readonly managerApiBase: string;
  private readonly liveCommonVersion: string;

  constructor(managerApiBase: string, liveCommonVersion: string) {
    this.managerApiBase = managerApiBase;
    this.liveCommonVersion = liveCommonVersion;
  }

  readonly fetchLatestFirmware: ManagerApiRepository["fetchLatestFirmware"] = makeLRUCache(
    async ({
      current_se_firmware_final_version,
      device_version,
      providerId,
      userId,
    }: FetchLatestFirmwareOptions) => {
      const salt = getUserHashes(userId).firmwareSalt;
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
          pathname: `${this.managerApiBase}/get_latest_firmware`,
          query: {
            livecommonversion: this.liveCommonVersion,
            salt,
          },
        }),
        data: {
          current_se_firmware_final_version,
          device_version,
          provider: providerId,
        },
      });

      if (data.result === "null") {
        return null;
      }

      return data.se_firmware_osu_version;
    },
    (a: FetchLatestFirmwareOptions) =>
      `${a.current_se_firmware_final_version}_${a.device_version}_${a.providerId}`,
  );

  readonly fetchMcus: ManagerApiRepository["fetchMcus"] = makeLRUCache(
    async () => {
      const { data } = await network({
        method: "GET",
        url: URL.format({
          pathname: `${this.managerApiBase}/mcu_versions`,
          query: {
            livecommonversion: this.liveCommonVersion,
          },
        }),
      });
      return data;
    },
    () => "",
  );

  readonly getDeviceVersion: ManagerApiRepository["getDeviceVersion"] = makeLRUCache(
    async ({ targetId, providerId }: GetDeviceVersionOptions) => {
      const {
        data,
      }: {
        data: DeviceVersionEntity;
      } = await network({
        method: "POST",
        url: URL.format({
          pathname: `${this.managerApiBase}/get_device_version`,
          query: {
            livecommonversion: this.liveCommonVersion,
          },
        }),
        data: {
          provider: providerId,
          target_id: targetId,
        },
      }).catch((error: ResponseErrorType) => {
        const status = error?.status || error?.response?.status;
        if (status === 404)
          throw new FirmwareNotRecognized(`manager api did not recognize targetId=${targetId}`, {
            targetId,
          });
        throw error;
      });
      return data;
    },
    ({ targetId, providerId }: GetDeviceVersionOptions) => `${targetId}_${providerId}`,
  );

  readonly getCurrentOsu: ManagerApiRepository["getCurrentOsu"] = makeLRUCache(
    async (input: GetCurrentOsuOptions) => {
      const { data } = await network({
        method: "POST",
        url: URL.format({
          pathname: `${this.managerApiBase}/get_osu_version`,
          query: {
            livecommonversion: this.liveCommonVersion,
          },
        }),
        data: {
          device_version: input.deviceId,
          version_name: `${input.version}-osu`,
          provider: input.providerId,
        },
      });
      return data;
    },
    (a: GetCurrentOsuOptions) => `${a.version}_${a.deviceId}_${a.providerId}`,
  );

  readonly getCurrentFirmware: ManagerApiRepository["getCurrentFirmware"] = makeLRUCache(
    async (input: GetCurrentFirmwareOptions) => {
      const {
        data,
      }: {
        data: FinalFirmware;
      } = await network({
        method: "POST",
        url: URL.format({
          pathname: `${this.managerApiBase}/get_firmware_version`,
          query: {
            livecommonversion: this.liveCommonVersion,
          },
        }),
        data: {
          device_version: input.deviceId,
          version_name: input.version,
          provider: input.providerId,
        },
      }).catch((error: ResponseErrorType) => {
        const status = error?.status || error?.response?.status;

        if (status === 404) throw new FirmwareNotRecognized();

        throw error;
      });
      return data;
    },
    (a: GetCurrentFirmwareOptions) => `${a.version}_${a.deviceId}_${a.providerId}`,
  );

  readonly getFinalFirmwareById: ManagerApiRepository["getFinalFirmwareById"] = makeLRUCache(
    async (id: number) => {
      const {
        data,
      }: {
        data: FinalFirmware;
      } = await network({
        method: "GET",
        url: URL.format({
          pathname: `${this.managerApiBase}/firmware_final_versions/${id}`,
          query: {
            livecommonversion: this.liveCommonVersion,
          },
        }),
      });
      return data;
    },
    (id: number) => String(id),
  );

  readonly getAppsByHash: ManagerApiRepository["getAppsByHash"] = makeLRUCache(
    async (hashes: string[]) => {
      const {
        data,
      }: {
        data: (ApplicationV2Entity | null)[];
      } = await network({
        method: "POST",
        url: URL.format({
          pathname: `${this.managerApiBase}/v2/apps/hash`,
          query: {
            livecommonversion: this.liveCommonVersion,
          },
        }),
        data: hashes,
      });

      if (!data || !Array.isArray(data)) {
        throw new NetworkDown("");
      }

      return data;
    },
    (hashes: string[]) => `${this.managerApiBase}_${hashes.join("-")}`,
  );

  readonly catalogForDevice: ManagerApiRepository["catalogForDevice"] = makeLRUCache(
    async (params: CatalogForDeviceOptions) => {
      const { provider, targetId, firmwareVersion } = params;
      const {
        data,
      }: {
        data: ApplicationV2Entity[];
      } = await network({
        method: "GET",
        url: URL.format({
          pathname: `${this.managerApiBase}/v2/apps/by-target`,
          query: {
            livecommonversion: this.liveCommonVersion,
            provider,
            target_id: targetId,
            firmware_version_name: firmwareVersion,
          },
        }),
      });

      if (!data || !Array.isArray(data)) {
        throw new NetworkDown("");
      }

      return data;
    },
    (a: CatalogForDeviceOptions) =>
      `${this.managerApiBase}_${a.provider}_${a.targetId}_${a.firmwareVersion}`,
  );

  readonly getLanguagePackagesForDevice = async (
    deviceInfo: DeviceInfoEntity,
    forceProvider?: number,
  ) => {
    const deviceVersion = await this.getDeviceVersion({
      targetId: deviceInfo.targetId,
      providerId: getProviderIdUseCase({ deviceInfo, forceProvider }),
    });

    const seFirmwareVersion = await this.getCurrentFirmware({
      version: deviceInfo.version,
      deviceId: deviceVersion.id,
      providerId: getProviderIdUseCase({ deviceInfo, forceProvider }),
    });

    const { data }: { data: LanguagePackageResponseEntity[] } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${this.managerApiBase}/language-package`,
        query: {
          livecommonversion: this.liveCommonVersion,
        },
      }),
    });

    const allPackages: LanguagePackageEntity[] = data.reduce(
      (acc, response) => [
        ...acc,
        ...response.language_package_version.map(p => ({
          ...p,
          language: response.language,
        })),
      ],
      [] as LanguagePackageEntity[],
    );

    const packages = allPackages.filter(
      pack =>
        pack.device_versions.includes(deviceVersion.id) &&
        pack.se_firmware_final_versions.includes(seFirmwareVersion.id),
    );

    return packages;
  };
}
