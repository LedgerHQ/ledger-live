import { isAction, type Middleware } from "@reduxjs/toolkit";
import { marketCountervaluesApi } from "@domain/api-market-countervalues";
import { setCountervaluesState } from "@domain/entity-market-countervalues";
import {
  countervaluesLoadFailed,
  countervaluesLoadRequested,
  countervaluesLoadStarted,
  countervaluesLoadSucceeded,
  startCountervaluesSync,
} from "@features/platform-market-countervalues";
import { logStartupEvent, startupEvents } from "./logStartupTime";

const { getHistoricalRates, getSpotRates, getCounterValueIdsSortedByMarketCap } =
  marketCountervaluesApi.endpoints;

/**
 * Logs each step of the first countervalues sync as a startup event, then steps aside once the
 * first load has landed. Placed before the countervalues middleware, so "handled" and "applied"
 * events also cover that middleware and the store subscribers.
 */
export function createCountervaluesStartupEventsMiddleware(): Middleware {
  let loadStarted = false;
  let done = false;
  let lastRatesAnsweredAt: number | undefined;

  return () => next => action => {
    if (done || !isAction(action)) return next(action);

    if (startCountervaluesSync.match(action)) {
      const result = next(action);
      logStartupEvent("CV start handled");
      return result;
    }
    if (setCountervaluesState.match(action)) {
      const step = loadStarted ? "CV load result" : "CV restore";
      if (loadStarted && lastRatesAnsweredAt !== undefined) {
        startupEvents.push({ event: "CV last rates answered", time: lastRatesAnsweredAt });
      }
      logStartupEvent(`${step} set`);
      const result = next(action);
      logStartupEvent(`${step} applied`);
      return result;
    }

    if (countervaluesLoadRequested.match(action)) logStartupEvent("CV load requested");
    else if (countervaluesLoadStarted.match(action)) {
      loadStarted = true;
      logStartupEvent("CV load started");
    } else if (countervaluesLoadSucceeded.match(action) || countervaluesLoadFailed.match(action)) {
      done = true;
    } else if (getCounterValueIdsSortedByMarketCap.matchPending(action)) {
      logStartupEvent("CV supported ids requested");
    } else if (getCounterValueIdsSortedByMarketCap.matchFulfilled(action)) {
      logStartupEvent("CV supported ids answered");
    } else if (getHistoricalRates.matchPending(action) || getSpotRates.matchPending(action)) {
      logStartupEvent("CV rates requested");
    } else if (getHistoricalRates.matchFulfilled(action) || getSpotRates.matchFulfilled(action)) {
      lastRatesAnsweredAt = logStartupEvent("CV rates answered").time;
    } else if (getHistoricalRates.matchRejected(action) || getSpotRates.matchRejected(action)) {
      logStartupEvent("CV rates failed");
    }
    return next(action);
  };
}
