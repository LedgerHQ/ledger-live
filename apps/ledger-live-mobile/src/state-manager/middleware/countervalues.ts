import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { getEnv } from "@shared/env";
import {
  createRateSource,
  marketCountervaluesApi,
  type RateSource,
} from "@domain/api-market-countervalues";
import { createMockRateSource } from "@domain/api-market-countervalues/mock";
import { createCountervaluesMiddleware } from "@features/platform-market-countervalues";
import { AppStateActionTypes } from "~/actions/types";
import { createCountervaluesSettingsSelector } from "~/reducers/countervalues";
import type { State } from "~/reducers/types";
import { subscribeCountervaluesAppEvents } from "./countervaluesAppEvents";

/**
 * Builds the rate source the countervalues loop fetches through.
 *
 * The choice between real and mocked rates is made here, at composition time, rather than inside
 * the fetch path: `@domain/api-market-countervalues` reads no environment, so what used to be a
 * hidden `MOCK_COUNTERVALUES` dispatcher two layers down is now one visible branch.
 */
export function createCountervaluesRates(
  dispatch: ThunkDispatch<unknown, unknown, UnknownAction>,
): RateSource {
  if (getEnv("MOCK_COUNTERVALUES")) return createMockRateSource(getEnv("MOCK"));

  return createRateSource({
    // Dispatch with `forceRefetch` and without `subscribe: false`; see the RateFetchers docs.
    fetchHistoricalWindow: args =>
      dispatch(
        marketCountervaluesApi.endpoints.getHistoricalRates.initiate(args, { forceRefetch: true }),
      ),
    fetchSpotBatch: args =>
      dispatch(
        marketCountervaluesApi.endpoints.getSpotRates.initiate(args, { forceRefetch: true }),
      ),
  });
}

/**
 * The countervalues loop for the mobile store. A reboot remounts the whole app tree, so the loop
 * starts again from the saved state once the reboot's wipe has landed.
 */
export function createMobileCountervaluesMiddleware() {
  return createCountervaluesMiddleware<State>({
    createSettingsSelector: createCountervaluesSettingsSelector,
    createRates: createCountervaluesRates,
    subscribeAppEvents: subscribeCountervaluesAppEvents,
    restartOn: action => action.type === AppStateActionTypes.INCREMENT_REBOOT_ID,
  });
}
