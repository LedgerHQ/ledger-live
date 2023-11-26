import network from "@ledgerhq/live-network/network";
import qs from "qs";
import { getEnv } from "@ledgerhq/live-env";
import { FilterParams } from "../../../filters";
import type { LiveAppManifest } from "../../../types";
import mockData from "./mock.json";

const api = {
  fetchLiveAppManifests: async (url: string, params?: FilterParams): Promise<LiveAppManifest[]> => {
    if (getEnv("MOCK")) {
      if (getEnv("MOCK_REMOTE_LIVE_MANIFEST")) {
        return [
          ...mockData,
          ...JSON.parse(getEnv("MOCK_REMOTE_LIVE_MANIFEST")),
        ] as LiveAppManifest[];
      }
      return mockData as LiveAppManifest[];
    }
    try {
      const { data }: { data: LiveAppManifest[] } = await network({
        method: "GET",
        params,
        paramsSerializer: params => {
          return qs.stringify(params, { arrayFormat: "repeat" });
        },
        url,
      });

      if (!Array.isArray(data)) throw new Error("Response is not an Array");
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  },
};
export default api;
