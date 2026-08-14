/**
 * Moved to `@domain/api-swap-quotes/store`. Re-exported here so the apps'
 * startup wiring keeps working.
 */
export {
  getSwapQuotesDispatch,
  resetSwapQuotesStore,
  setSwapQuotesStore,
} from "@domain/api-swap-quotes/store";
export type { SwapQuotesDispatch } from "@domain/api-swap-quotes/store";
