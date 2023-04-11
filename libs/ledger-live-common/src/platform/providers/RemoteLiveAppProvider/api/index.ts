import network from "../../../../network";
import { getEnv } from "../../../../env";
import type { LiveAppManifest } from "../../../types";
import mockData from "./mock.json";
import { FilterParams } from "../../../filters";
import qs from "qs";

const dummyManifest: LiveAppManifest = {
  id: "dummy-wallet-app",
  name: "Dummy Wallet App",
  url: "http://localhost:3000",
  homepageUrl: "https://developers.ledger.com/",
  icon: "",
  platform: "all",
  apiVersion: "^1.0.0 || ~0.0.1",
  manifestVersion: "1",
  branch: "stable",
  categories: ["tools"],
  currencies: "*",
  content: {
    shortDescription: {
      en: "Dummy app for testing the Platform apps and Live SDK in E2E (Playwright) tests",
    },
    description: {
      en: "Dummy app for testing the Platform apps and Live SDK in E2E (Playwright) tests",
    },
  },
  permissions: [
    {
      method: "*",
    },
  ],
  domains: ["*"],
};

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
    try {
      const { data }: { data: LiveAppManifest[] } = await network({
        method: "GET",
        params,
        paramsSerializer: (params) => {
          return qs.stringify(params, { arrayFormat: "repeat" });
        },
        url,
      });

      if (!Array.isArray(data)) throw new Error("Response is not an Array");
      data.push(dummyManifest);
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  },
};
export default api;
