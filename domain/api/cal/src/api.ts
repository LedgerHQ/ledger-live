import { calApi, getCalExtra } from "@shared/api-services";
import { probeCal } from "./internals";
import type { CalProbeResult } from "./types";

/**
 * CAL probe endpoint, injected into the shared CAL service api (same store slice and middleware as
 * every other CAL use case). It bypasses the base query on purpose: no shared retry, own timeout.
 * The result is not kept once unsubscribed, so a new subscription or `refetch()` probes again.
 */
export const calProbeApi = calApi.injectEndpoints({
  endpoints: build => ({
    getCalProbe: build.query<CalProbeResult, void>({
      async queryFn(_arg, queryApi) {
        const extra = getCalExtra(queryApi);
        return { data: await probeCal(extra.calServiceUrl, extra.ledgerClientVersion) };
      },
      keepUnusedDataFor: 0,
    }),
  }),
});

/** Probe hook: `data` is `"ok" | "failed" | "offline"` once settled; call `refetch()` to re-probe. */
export const { useGetCalProbeQuery } = calProbeApi;
