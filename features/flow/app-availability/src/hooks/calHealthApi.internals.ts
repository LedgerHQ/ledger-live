import { calApi, getCalExtra } from "@shared/api-services";
import { getNetworkState } from "@shared/network-status";
import { checkCalHealth, forcedCalHealth, type CalHealthResult } from "./calHealth.internals";

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
        const forcedResult = forcedCalHealth();
        if (forcedResult !== undefined) {
          return { data: forcedResult };
        }

        try {
          const { calServiceUrl, ledgerClientVersion } = getCalExtra(queryApi);
          const data = await checkCalHealth({
            calServiceUrl,
            ledgerClientVersion,
            isOffline: deviceIsOffline,
          });
          return { data };
        } catch {
          if (await deviceIsOffline()) {
            return { data: "offline" };
          }
          return { data: "failed" };
        }
      },
    }),
  }),
});

export const { useCheckCalHealthQuery } = calHealthApi;
