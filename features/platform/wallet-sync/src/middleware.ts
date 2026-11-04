import { createAction, type Middleware, type UnknownAction } from "@reduxjs/toolkit";
import { LedgerSyncMiddlewareMissingError } from "./errors";
import { createLedgerSyncServices } from "./internals/services";
import { createLedgerSyncWatch } from "./internals/watch";
import type { LedgerSyncMiddlewareConfig, LedgerSyncStateRoot } from "./types";
import { refreshLedgerSync, startLedgerSyncWatch, stopLedgerSyncWatch } from "./watch";

type LedgerSyncServices = ReturnType<typeof createLedgerSyncServices>;
type AnyDispatch = (action: UnknownAction) => unknown;

const requestLedgerSyncServices = createAction("ledgerSync/requestServices");

/**
 * Builds the store's Ledger Sync services on the first request, and holds them for
 * {@link getLkrpSdk}, {@link getCloudSyncSdk}, {@link getLkrpQrCode} and
 * {@link getLedgerSyncStatus}. Every caller of the store then shares the Cloud Sync SDK's push,
 * pull and destroy lock. Once {@link startLedgerSyncWatch} is dispatched, it also runs the Wallet
 * Sync watch loop, and restarts it whenever what it runs on changes.
 */
export function createLedgerSyncMiddleware<S extends LedgerSyncStateRoot, LocalState, Update>(
  config: LedgerSyncMiddlewareConfig<S, LocalState, Update>,
): Middleware<object, S> {
  return store => {
    let services: LedgerSyncServices | undefined;
    let watch: ReturnType<typeof createLedgerSyncWatch> | undefined;
    const theServices = () => (services ??= createLedgerSyncServices(store, config));
    return next => action => {
      if (requestLedgerSyncServices.match(action)) return theServices();
      if (startLedgerSyncWatch.match(action)) {
        (watch ??= createLedgerSyncWatch(store, config, theServices())).start();
      }
      if (stopLedgerSyncWatch.match(action)) watch?.stop();
      if (refreshLedgerSync.match(action)) watch?.refresh();
      const result = next(action);
      watch?.update();
      return result;
    };
  };
}

export const getLkrpSdk = (dispatch: AnyDispatch) => getServices(dispatch).lkrpSdk;
export const getCloudSyncSdk = (dispatch: AnyDispatch) => getServices(dispatch).cloudSyncSdk;
export const getLkrpQrCode = (dispatch: AnyDispatch) => getServices(dispatch).lkrpQrCode;
export const getLedgerSyncStatus = (dispatch: AnyDispatch) => getServices(dispatch).status;

/** The store's Ledger Sync middleware answers this dispatch with its services instead of passing it on. */
function getServices(dispatch: AnyDispatch): LedgerSyncServices {
  const answer = dispatch(requestLedgerSyncServices());
  if (!isLedgerSyncServices(answer)) throw new LedgerSyncMiddlewareMissingError();
  return answer;
}

/** A store without the middleware returns the request action instead. */
function isLedgerSyncServices(value: unknown): value is LedgerSyncServices {
  return typeof value === "object" && value !== null && "lkrpSdk" in value;
}
