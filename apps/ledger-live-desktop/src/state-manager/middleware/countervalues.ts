import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { getEnv } from "@shared/env";
import { subscribeToNetworkState, type NetworkState } from "@shared/network-status";
import {
  createRateSource,
  marketCountervaluesApi,
  type RateSource,
} from "@domain/api-market-countervalues";
import { createMockRateSource } from "@domain/api-market-countervalues/mock";
import type { CounterValuesStateRaw } from "@domain/entity-market-countervalues";
import {
  createCountervaluesMiddleware,
  type CountervaluesMiddlewareConfig,
  type CountervaluesPollingControls,
} from "@features/platform-market-countervalues";
import type { State } from "~/renderer/reducers";
import { createCountervaluesSettingsSelector } from "~/renderer/reducers/countervalues";
import { setKey } from "~/renderer/storage";

export type CountervaluesSources = Pick<
  CountervaluesMiddlewareConfig<State>,
  "subscribeAppEvents" | "persist"
>;

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

/** Polling follows the window: it stops on blur, restarts and refreshes on focus, and refreshes when
 * the network comes back to a focused window. */
export function subscribeWindowEvents({ poll, start, stop }: CountervaluesPollingControls) {
  const handleFocus = () => {
    start();
    poll();
  };
  // The current state is emitted on subscribe: only a later change means the network came back.
  let isInitialNetworkState = true;
  const handleNetworkChange = ({ isConnected }: NetworkState) => {
    if (isInitialNetworkState) {
      isInitialNetworkState = false;
      return;
    }
    if (isConnected && document.hasFocus()) {
      poll();
    }
  };

  window.addEventListener("blur", stop);
  window.addEventListener("focus", handleFocus);
  const unsubscribeNetwork = subscribeToNetworkState(handleNetworkChange);
  return () => {
    window.removeEventListener("blur", stop);
    window.removeEventListener("focus", handleFocus);
    unsubscribeNetwork();
  };
}

export function persistCountervalues(raw: CounterValuesStateRaw) {
  setKey("app", "countervalues", raw);
}

/** What the running app wires; unit tests leave both out. */
export const appCountervaluesSources: CountervaluesSources = {
  subscribeAppEvents: subscribeWindowEvents,
  persist: persistCountervalues,
};

export function createDesktopCountervaluesMiddleware(sources: CountervaluesSources = {}) {
  return createCountervaluesMiddleware<State>({
    createSettingsSelector: createCountervaluesSettingsSelector,
    createRates: createCountervaluesRates,
    ...sources,
  });
}
