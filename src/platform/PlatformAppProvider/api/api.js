// @flow

import network from "../../../network";
import type { AppManifest } from "../../types";
import type { PlatformApi } from "../types";

// expose a function to fetch data from the cdn (data from ledger-live-assets)
// https://cdn.live.ledger.com/

async function fetchManifest(
  platformAppsServerURL: string
): Promise<AppManifest[]> {
  const url = `${platformAppsServerURL}?t=${Date.now()}`;

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
