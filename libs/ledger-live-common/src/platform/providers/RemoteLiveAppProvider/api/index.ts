import network from "../../../../network";
import { getEnv } from "../../../../env";
import type { LiveAppManifest } from "../../../types";
import mockData from "./mock.json";
import { FilterParams } from "../../../filters";
import qs from "qs";

const api = {
  fetchLiveAppManifests: async (
    url: string,
    params?: FilterParams
  ): Promise<LiveAppManifest[]> => {
    if (getEnv("MOCK")) {
      if (getEnv("MOCK_REMOTE_LIVE_MANIFEST")) {
        return [
          ...mockData,
          ...JSON.parse(getEnv("MOCK_REMOTE_LIVE_MANIFEST")),
        ] as LiveAppManifest[];
      }
      return mockData as LiveAppManifest[];
    }
    const { data }: { data: LiveAppManifest[] } = await network({
      method: "GET",
      params,
      paramsSerializer: (params) => {
        return qs.stringify(params, { arrayFormat: "repeat" });
      },
      url,
    });
    return data;
  },
};
export default api;
