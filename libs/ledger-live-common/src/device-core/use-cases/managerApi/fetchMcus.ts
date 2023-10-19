import URL from "url";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";

type FetchMcuParams = {managerApiBase: string, liveCommonVersion: string};

const fetchMcus: (params: FetchMcuParams) => Promise<any> = makeLRUCache(
  async ({managerApiBase, liveCommonVersion}: FetchMcuParams) => {
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

export default fetchMcus;