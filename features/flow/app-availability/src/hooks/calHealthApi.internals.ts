import { calApi, getCalExtra } from "@shared/api-services";
import { getNetworkState } from "@shared/network-status";
import { checkCalHealth, type CalHealthResult } from "./calHealth.internals";

async function deviceIsOffline(): Promise<boolean> {
  try {
    const state = await getNetworkState();
    return state.isConnected === false || state.isInternetReachable === false;
  } catch {
    return false;
  }
}

export const calHealthApi = calApi.injectEndpoints({
  endpoints: build => ({
    checkCalHealth: build.query<CalHealthResult, void>({
      async queryFn(_arg, queryApi) {
        try {
          const { calServiceUrl, ledgerClientVersion } = getCalExtra(queryApi);
          const offline = await deviceIsOffline();
          const data = await checkCalHealth({
            calServiceUrl,
            ledgerClientVersion,
            isOffline: () => offline,
          });
          return { data };
        } catch {
          return { data: "failed" };
        }
      },
    }),
  }),
});

export const { useCheckCalHealthQuery } = calHealthApi;
