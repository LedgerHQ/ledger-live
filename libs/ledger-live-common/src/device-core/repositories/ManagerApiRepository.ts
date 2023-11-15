import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/lib/network";
// To refactor: use own entities
import { DeviceVersion, Id, OsuFirmware } from "@ledgerhq/types-live";
import { getUserHashes } from "../../user";
import URL from "url";
import { FirmwareNotRecognized } from "@ledgerhq/errors";

export class ManagerApiRepository {
  private readonly managerApiBase: string;
  private readonly liveCommonVersion: string;

  constructor(managerApiBase: string, liveCommonVersion: string) {
    this.managerApiBase = managerApiBase;
    this.liveCommonVersion = liveCommonVersion;
  }

  async fetchLatestFirmware(params: {
    current_se_firmware_final_version: Id;
    device_version: Id;
    providerId: number;
    userId: string;
  }): Promise<OsuFirmware | null | undefined> {
    return makeLRUCache(
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
              liveCommonVersion: this.liveCommonVersion,
              salt,
            },
          }),
          data: {
            current_se_firmware_final_version,
            device_version,
            providerId,
          },
        });

        if (data.result === "null") {
          return null;
        }

        return data.se_firmware_osu_version;
      },
      a => `${a.current_se_firmware_final_version}_${a.device_version}_${a.providerId}`,
    )(params);
  }

  fetchMcus(): Promise<any> {
    return makeLRUCache(
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
    )();
  }

  async getDeviceVersion({
    targetId,
    providerId,
  }: {
    targetId: string | number;
    providerId: number;
  }): Promise<DeviceVersion> {
    return makeLRUCache(
      async ({ targetId, providerId }) => {
        const {
          data,
        }: {
          data: DeviceVersion;
        } = await network({
          method: "POST",
          url: URL.format({
            pathname: `${this.managerApiBase}/get_device_version`,
            query: {
              livecommonversion: this.liveCommonVersion,
            },
          }),
          data: {
            providerId,
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
    )({ targetId, providerId });
  }
}
