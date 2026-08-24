import network from "@ledgerhq/live-network/network";
import qs from "qs";
import { getEnv } from "@shared/env";
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
    // Failures must propagate: resolving to `[]` would be indistinguishable from
    // a genuinely empty catalog, and callers would cache that as a successful
    // (but empty) registry — leaving every live app unresolvable ("App not found")
    // until the next scheduled refresh.
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
  },
};
export default api;
