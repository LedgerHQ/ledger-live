import URL from "url";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";

export type FetchMcusParams = { managerApiBase: string; liveCommonVersion: string };

export const fetchMcus: (params: FetchMcusParams) => Promise<any> = makeLRUCache(
  async ({ managerApiBase, liveCommonVersion }: FetchMcusParams) => {
    const { data } = await network({
      method: "GET",
      url: URL.format({
        pathname: `${managerApiBase}/mcu_versions`,
        query: {
          livecommonversion: liveCommonVersion,
        },
      }),
    });
    return data;
  },
  () => "",
);
