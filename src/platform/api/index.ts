import { getEnv } from "../../env";
import type { PlatformApi } from "../types";
import prodApi from "./api";
import mockApi from "./api.mock";
const api: PlatformApi = {
  fetchManifest: () =>
    getEnv("MOCK") || !getEnv("PLATFORM_API_URL")
      ? mockApi.fetchManifest()
      : prodApi.fetchManifest(),
};
export default api;
