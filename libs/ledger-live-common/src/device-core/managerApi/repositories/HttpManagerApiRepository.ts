import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { getUserHashes } from "../../../user";
import URL from "url";
import { FirmwareNotRecognized } from "@ledgerhq/errors";
import { ManagerApiRepository } from "./ManagerApiRepository";
import { FinalFirmware, OsuFirmware } from "../entities/FirmwareUpdateContextEntity";
import { DeviceVersionEntity } from "../entities/DeviceVersionEntity";

export class HttpManagerApiRepository implements ManagerApiRepository {
  private readonly managerApiBase: string;
  private readonly liveCommonVersion: string;

  constructor(managerApiBase: string, liveCommonVersion: string) {
    this.managerApiBase = managerApiBase;
    this.liveCommonVersion = liveCommonVersion;
  }

  readonly fetchLatestFirmware = makeLRUCache(
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

  readonly fetchMcus = makeLRUCache(
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

  readonly getDeviceVersion = makeLRUCache(
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
        const status = error && (error.status || (error.response && error.response.status)); // FIXME LLD is doing error remapping already. we probably need to move the remapping in live-common

        if (status === 404) {
          throw new FirmwareNotRecognized("manager api did not recognize targetId=" + targetId, {
            targetId,
          });
        }

        throw error;
      });
      return data;
    },
    ({ targetId, providerId }) => `${targetId}_${providerId}`,
  );

  readonly getCurrentOSU = makeLRUCache(
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

  readonly getCurrentFirmware = makeLRUCache(
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
      });
      return data;
    },
    a => `${a.version}_${a.deviceId}_${a.providerId}`,
  );

  readonly getFinalFirmwareById = makeLRUCache(
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
}
