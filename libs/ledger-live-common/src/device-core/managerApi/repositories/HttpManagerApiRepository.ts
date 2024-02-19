import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { FirmwareNotRecognized, NetworkDown } from "@ledgerhq/errors";
import { getUserHashes } from "../../../user";
import URL from "url";
import { ManagerApiRepository } from "./ManagerApiRepository";
import { FinalFirmware, OsuFirmware } from "../entities/FirmwareUpdateContextEntity";
import { DeviceVersionEntity } from "../entities/DeviceVersionEntity";
import { ApplicationV2Entity } from "../entities/AppEntity";
import { DeviceInfoEntity } from "../entities/DeviceInfoEntity";
import {
  LanguagePackageEntity,
  LanguagePackageResponseEntity,
} from "../entities/LanguagePackageEntity";
import { getProviderIdUseCase } from "../use-cases/getProviderIdUseCase";

export class HttpManagerApiRepository implements ManagerApiRepository {
  private readonly managerApiBase: string;
  private readonly liveCommonVersion: string;

  constructor(managerApiBase: string, liveCommonVersion: string) {
    this.managerApiBase = managerApiBase;
    this.liveCommonVersion = liveCommonVersion;
  }

  // NB: we are explicitly specifying the type because TypeScript cannot infer
  // properly the return type of `makeLRUCache` without using `any` for the
  // parameters.
  readonly fetchLatestFirmware: ManagerApiRepository["fetchLatestFirmware"] = makeLRUCache(
    async ({ current_se_firmware_final_version, device_version, providerId, userId }) => {
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
    a => `${a.current_se_firmware_final_version}_${a.device_version}_${a.providerId}`,
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
    async ({ targetId, providerId }) => {
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
    ({ targetId, providerId }) => `${targetId}_${providerId}`,
  );

  readonly getCurrentOSU: ManagerApiRepository["getCurrentOSU"] = makeLRUCache(
    async input => {
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
    a => `${a.version}_${a.deviceId}_${a.providerId}`,
  );

  readonly getCurrentFirmware: ManagerApiRepository["getCurrentFirmware"] = makeLRUCache(
    async input => {
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
      }).catch(error => {
        const status = error?.status || error?.response?.status;

        if (status === 404) throw new FirmwareNotRecognized();

        throw error;
      });
      return data;
    },
    a => `${a.version}_${a.deviceId}_${a.providerId}`,
  );

  readonly getFinalFirmwareById: ManagerApiRepository["getFinalFirmwareById"] = makeLRUCache(
    async id => {
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
    id => String(id),
  );

  readonly getAppsByHash: ManagerApiRepository["getAppsByHash"] = makeLRUCache(
    async hashes => {
      const {
        data,
      }: {
        data: Array<ApplicationV2Entity | null>;
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
    hashes => `${this.managerApiBase}_${hashes.join("-")}`,
  );

  readonly catalogForDevice: ManagerApiRepository["catalogForDevice"] = makeLRUCache(
    async params => {
      const { provider, targetId, firmwareVersion } = params;
      const {
        data,
      }: {
        data: Array<ApplicationV2Entity>;
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
    a => `${this.managerApiBase}_${a.provider}_${a.targetId}_${a.firmwareVersion}`,
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
