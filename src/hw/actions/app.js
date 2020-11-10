// @flow
import invariant from "invariant";
import {
  concat,
  of,
  empty,
  interval,
  Observable,
  throwError,
  TimeoutError,
} from "rxjs";
import {
  scan,
  debounce,
  debounceTime,
  catchError,
  timeout,
  switchMap,
  tap,
  distinctUntilChanged,
  takeWhile,
} from "rxjs/operators";
import isEqual from "lodash/isEqual";
import { useEffect, useCallback, useState, useMemo } from "react";
import { log } from "@ledgerhq/logs";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  getDerivationScheme,
  getDerivationModesForCurrency,
  runDerivationScheme,
} from "../../derivation";
import type {
  AppAndVersion,
  ConnectAppEvent,
  Input as ConnectAppInput,
} from "../connectApp";
import type { Account, CryptoCurrency, TokenCurrency } from "../../types";
import { useReplaySubject } from "../../observable";
import { getAccountName } from "../../account";
import type { Device, Action } from "./types";
import { shouldUpgrade } from "../../apps";
import { ConnectAppTimeout } from "../../errors";
import perFamilyAccount from "../../generated/account";

type State = {|
  isLoading: boolean,
  requestQuitApp: boolean,
  requestOpenApp: ?string,
  requiresAppInstallation: ?{ appName: string },
  opened: boolean,
  appAndVersion: ?AppAndVersion,
  unresponsive: boolean,
  allowOpeningRequestedWording: ?string,
  allowOpeningGranted: boolean,
  device: ?Device,
  error: ?Error,
  derivation: ?{ address: string },
  displayUpgradeWarning: boolean,
|};

export type AppState = {|
  ...State,
  onRetry: () => void,
  passWarning: () => void,
  inWrongDeviceForAccount: ?{ accountName: string },
|};

export type AppRequest = {
  appName?: ?string,
  currency?: ?CryptoCurrency,
  account?: ?Account,
  tokenCurrency?: ?TokenCurrency,
};

export type AppResult = {|
  device: Device,
  appAndVersion: ?AppAndVersion,
|};

type AppAction = Action<AppRequest, AppState, AppResult>;

type Event =
  | { type: "error", error: Error, device?: ?Device }
  | { type: "deviceChange", device: ?Device }
  | ConnectAppEvent
  | { type: "display-upgrade-warning", displayUpgradeWarning: boolean };

const mapResult = ({
  opened,
  device,
  appAndVersion,
  displayUpgradeWarning,
}: AppState): ?AppResult =>
  opened && device && !displayUpgradeWarning ? { device, appAndVersion } : null;

const getInitialState = (device?: ?Device): State => ({
  isLoading: !!device,
  requestQuitApp: false,
  requestOpenApp: null,
  unresponsive: false,
  requiresAppInstallation: null,
  allowOpeningRequestedWording: null,
  allowOpeningGranted: false,
  device: null,
  opened: false,
  appAndVersion: null,
  error: null,
  derivation: null,
  displayUpgradeWarning: false,
});

const reducer = (state: State, e: Event): State => {
  switch (e.type) {
    case "unresponsiveDevice":
      return {
        ...state,
        unresponsive: true,
      };

    case "disconnected":
      return getInitialState();

    case "deviceChange":
      return {
        ...getInitialState(e.device),
        device: e.device,
      };

    case "error":
      return {
        ...getInitialState(e.device),
        device: e.device || null,
        error: e.error,
        isLoading: false,
      };

    case "ask-open-app":
      return {
        isLoading: false,
        requestQuitApp: false,
        requiresAppInstallation: null,
        allowOpeningRequestedWording: null,
        allowOpeningGranted: false,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        unresponsive: false,
        requestOpenApp: e.appName,
      };

    case "ask-quit-app":
      return {
        isLoading: false,
        requestOpenApp: null,
        requiresAppInstallation: null,
        allowOpeningRequestedWording: null,
        allowOpeningGranted: false,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        unresponsive: false,
        requestQuitApp: true,
      };

    case "device-permission-requested":
      return {
        isLoading: false,
        requestQuitApp: false,
        requestOpenApp: null,
        requiresAppInstallation: null,
        allowOpeningGranted: false,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        unresponsive: false,
        allowOpeningRequestedWording: e.wording,
      };

    case "device-permission-granted":
      return {
        isLoading: false,
        requestQuitApp: false,
        requestOpenApp: null,
        requiresAppInstallation: null,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        unresponsive: false,
        allowOpeningRequestedWording: null,
        allowOpeningGranted: true,
      };

    case "app-not-installed":
      return {
        requestQuitApp: false,
        requestOpenApp: null,
        allowOpeningGranted: false,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        isLoading: false,
        unresponsive: false,
        allowOpeningRequestedWording: null,
        requiresAppInstallation: { appName: e.appName },
      };

    case "opened":
      return {
        requestQuitApp: false,
        requestOpenApp: null,
        requiresAppInstallation: null,
        allowOpeningRequestedWording: null,
        allowOpeningGranted: false,
        device: state.device,
        error: null,
        isLoading: false,
        unresponsive: false,
        opened: true,
        appAndVersion: e.app,
        derivation: e.derivation,
        displayUpgradeWarning:
          state.device && e.app
            ? shouldUpgrade(state.device.modelId, e.app.name, e.app.version)
            : false,
      };
  }
  return state;
};

function inferCommandParams(appRequest: AppRequest) {
  let derivationMode;
  let derivationPath;

  let appName = appRequest.appName;
  const account = appRequest.account;
  let currency = appRequest.currency;
  if (!currency && account) {
    currency = account.currency;
  }
  if (!appName && currency) {
    appName = currency.managerAppName;
  }

  invariant(appName, "appName or currency or account is missing");

  if (!currency) {
    return { appName };
  }

  let extra;

  if (account) {
    derivationMode = account.derivationMode;
    derivationPath = account.freshAddressPath;
    const m = perFamilyAccount[account.currency.family];
    if (m && m.injectGetAddressParams) {
      extra = m.injectGetAddressParams(account);
    }
  } else {
    const modes = getDerivationModesForCurrency(currency);
    derivationMode = modes[modes.length - 1];
    derivationPath = runDerivationScheme(
      getDerivationScheme({ currency, derivationMode }),
      currency
    );
  }

  return {
    appName,
    requiresDerivation: {
      derivationMode,
      path: derivationPath,
      currencyId: currency.id,
      ...extra,
    },
  };
}

const implementations = {
  // in this paradigm, we know that deviceSubject is reflecting the device events
  // so we just trust deviceSubject to reflect the device context (switch between apps, dashboard,...)
  event: ({ deviceSubject, connectApp, params }) =>
    deviceSubject.pipe(
      // debounce a bit the connect/disconnect event that we don't need
      debounceTime(1000),
      // each time there is a device change, we pipe to the command
      switchMap((device) =>
        concat(of({ type: "deviceChange", device }), connectApp(device, params))
      )
    ),

  // in this paradigm, we can't observe directly the device, so we have to poll it
  polling: ({ deviceSubject, params, connectApp }) =>
    Observable.create((o) => {
      const POLLING = 2000;
      const INIT_DEBOUNCE = 5000;
      const DISCONNECT_DEBOUNCE = 5000;
      const DEVICE_POLLING_TIMEOUT = 20000;

      // this pattern allows to actually support events based (like if deviceSubject emits new device changes) but inside polling paradigm
      let pollingOnDevice;
      const sub = deviceSubject.subscribe((d) => {
        if (d) {
          pollingOnDevice = d;
        }
      });
      let initT = setTimeout(() => {
        // initial timeout to unset the device if it's still not connected
        o.next({ type: "deviceChange", device: null });
        device = null;
        log("app/polling", "device init timeout");
      }, INIT_DEBOUNCE);

      let connectSub;
      let loopT;
      let disconnectT;
      let device = null; // used as internal state for polling

      function loop() {
        if (!pollingOnDevice) {
          loopT = setTimeout(loop, POLLING);
          return;
        }
        log("app/polling", "polling loop");
        connectSub = connectApp(pollingOnDevice, params)
          .pipe(
            timeout(DEVICE_POLLING_TIMEOUT),
            catchError((err) => {
              const productName = getDeviceModel(pollingOnDevice.modelId)
                .productName;

              return err instanceof TimeoutError
                ? of({
                    type: "error",
                    error: (new ConnectAppTimeout(null, {
                      productName,
                    }): Error),
                  })
                : throwError(err);
            })
          )
          .subscribe({
            next: (event) => {
              if (initT) {
                clearTimeout(initT);
                initT = null;
              }
              if (disconnectT) {
                // any connect app event unschedule the disconnect debounced event
                disconnectT = null;
                clearTimeout(disconnectT);
              }
              if (event.type === "unresponsiveDevice") {
                return; // ignore unresponsive case which happens for polling
              } else if (event.type === "disconnected") {
                // the disconnect event is delayed to debounce the reconnection that happens when switching apps
                disconnectT = setTimeout(() => {
                  disconnectT = null;
                  // a disconnect will locally be remembered via locally setting device to null...
                  device = null;
                  o.next(event);
                  log("app/polling", "device disconnect timeout");
                }, DISCONNECT_DEBOUNCE);
              } else {
                if (device !== pollingOnDevice) {
                  // ...but any time an event comes back, it means our device was responding and need to be set back on in polling context
                  device = pollingOnDevice;
                  o.next({ type: "deviceChange", device });
                }
                o.next(event);
              }
            },
            complete: () => {
              // poll again in some time
              loopT = setTimeout(loop, POLLING);
            },
            error: (e) => {
              o.error(e);
            },
          });
      }

      // delay a bit the first loop run in order to be async and wait pollingOnDevice
      loopT = setTimeout(loop, 0);

      return () => {
        if (initT) clearTimeout(initT);
        if (disconnectT) clearTimeout(disconnectT);
        if (connectSub) connectSub.unsubscribe();
        sub.unsubscribe();
        clearTimeout(loopT);
      };
    }).pipe(distinctUntilChanged(isEqual)),
};

export let currentMode: $Keys<typeof implementations> = "event";

export function setDeviceMode(mode: $Keys<typeof implementations>) {
  currentMode = mode;
}

export const createAction = (
  connectAppExec: (ConnectAppInput) => Observable<ConnectAppEvent>
): AppAction => {
  const connectApp = (device, params) =>
    !device
      ? empty()
      : connectAppExec({
          modelId: device.modelId,
          devicePath: device.deviceId,
          ...params,
        }).pipe(catchError((error: Error) => of({ type: "error", error })));

  const useHook = (device: ?Device, appRequest: AppRequest): AppState => {
    // repair modal will interrupt everything and be rendered instead of the background content
    const [state, setState] = useState(() => getInitialState(device));
    const [resetIndex, setResetIndex] = useState(0);
    const deviceSubject = useReplaySubject(device);

    const params = useMemo(
      () => inferCommandParams(appRequest),
      // for now i don't have better
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        appRequest.appName,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        appRequest.account && appRequest.account.id,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        appRequest.currency && appRequest.currency.id,
      ]
    );

    useEffect(() => {
      if (state.opened) return;
      const impl = implementations[currentMode];
      const sub = impl({ deviceSubject, connectApp, params })
        .pipe(
          tap((e) => log("actions-app-event", e.type, e)),
          // tap(e => console.log("connectApp event", e)),
          // we gather all events with a reducer into the UI state
          scan(reducer, getInitialState()),
          // tap((s) => console.log("connectApp state", s)),
          // we debounce the UI state to not blink on the UI
          debounce((s) => {
            if (s.allowOpeningRequestedWording || s.allowOpeningGranted) {
              // no debounce for allow event
              return empty();
            }
            // default debounce (to be tweak)
            return interval(2000);
          }),
          // $FlowFixMe
          takeWhile((s) => !s.requiresAppInstallation && !s.error, true)
        )
        // the state simply goes into a React state
        .subscribe(setState); // FIXME shouldn't we handle errors?! (is an error possible?)

      return () => {
        sub.unsubscribe();
      };
    }, [params, deviceSubject, state.opened, resetIndex]);

    const onRetry = useCallback(() => {
      setResetIndex((i) => i + 1);
      setState(getInitialState(device));
    }, [device]);

    const passWarning = useCallback(() => {
      setState((currState) => ({
        ...currState,
        displayUpgradeWarning: false,
      }));
    }, []);

    return {
      ...state,
      inWrongDeviceForAccount:
        state.derivation && appRequest.account
          ? state.derivation.address !== appRequest.account.freshAddress
            ? { accountName: getAccountName(appRequest.account) }
            : null
          : null,
      onRetry,
      passWarning,
    };
  };

  return {
    useHook,
    mapResult,
  };
};
