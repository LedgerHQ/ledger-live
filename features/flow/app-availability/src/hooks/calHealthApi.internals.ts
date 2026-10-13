import { calApi, getCalExtra } from "@shared/api-services";
import { checkCalHealth, type CalHealthResult } from "./calHealth.internals";

export const calHealthApi = calApi.injectEndpoints({
  endpoints: build => ({
    checkCalHealth: build.query<CalHealthResult, void>({
      async queryFn(_arg, queryApi) {
        try {
          const { calServiceUrl, ledgerClientVersion } = getCalExtra(queryApi);
          const data = await checkCalHealth({ calServiceUrl, ledgerClientVersion });
          return { data };
        } catch {
          return { data: "failed" };
        }
      },
    }),
  }),
});

export const { useCheckCalHealthQuery } = calHealthApi;
