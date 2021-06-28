// @flow

import { getEnv } from "../../env";
import network from "../../network";
import type { AppManifest, PlatformApi } from "../types";

// expose a function to fetch data from the cdn (data from ledger-live-assets)
// https://cdn.live.ledger.com/

const basePlatformUrl = () => getEnv("PLATFORM_API_URL");
const platformVersion = () => getEnv("PLATFORM_API_VERSION");

async function fetchManifest(): Promise<AppManifest[]> {
  const url = `${basePlatformUrl()}/v${platformVersion()}/data.json?t=${Date.now()}`;

  const { data } = await network({
    method: "GET",
    headers: {
      Origin: "http://localhost:3000",
    },
    url,
  });
  return data;
}

const api: PlatformApi = {
  fetchManifest,
};

export default api;
