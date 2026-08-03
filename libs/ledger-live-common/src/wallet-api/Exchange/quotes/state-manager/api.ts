/**
 * Moved to `@domain/api-swap-quotes`. Re-exported here so the existing
 * live-common call sites and the apps' `rtkQueryApi.ts` keep working.
 */
export {
  buildQuotesParams,
  splitQuotes,
  swapQuotesApi,
  transformFetchQuotesResponse,
} from "@domain/api-swap-quotes";
export type { FetchQuotesQueryArgs } from "@domain/api-swap-quotes";
