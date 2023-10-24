import { Id, OsuFirmware } from "@ledgerhq/types-live";
import { makeLRUCache } from "@ledgerhq/live-network/lib/cache";
import { getUserHashes } from "../getUserHashes";
import network from "@ledgerhq/live-network/lib/network";
import URL from "url";

export const fetchLatestFirmware: (arg0: {
  current_se_firmware_final_version: Id;
  device_version: Id;
  provider: number;
  userId: string;
  managerApiBase: string;
  liveCommonVersion: string;
}) => Promise<OsuFirmware | null | undefined> = makeLRUCache(
  async ({
    current_se_firmware_final_version,
    device_version,
    provider,
    userId,
    managerApiBase,
    liveCommonVersion,
  }) => {
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
        pathname: `${managerApiBase}/get_latest_firmware`,
        query: {
          liveCommonVersion,
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
  a => `${a.current_se_firmware_final_version}_${a.device_version}_${a.provider}`,
);
