import invariant from "invariant";
import {
  concat,
  of,
  timer,
  interval,
  Observable,
  throwError,
  TimeoutError,
  EMPTY,
} from "rxjs";
import {
  scan,
  debounce,
  catchError,
  timeout,
  switchMap,
  tap,
  distinctUntilChanged,
  takeWhile,
} from "rxjs/operators";
import isEqual from "lodash/isEqual";
import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { log } from "@ledgerhq/logs";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  getDerivationScheme,
  getDerivationModesForCurrency,
  runDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import type {
  AppAndVersion,
  ConnectAppEvent,
  Input as ConnectAppInput,
} from "../connectApp";
import { useReplaySubject } from "../../observable";
import { getAccountName } from "../../account";
import type { Device, Action } from "./types";
import { shouldUpgrade } from "../../apps";
import { AppOp, SkippedAppOp } from "../../apps/types";
import { ConnectAppTimeout } from "../../errors";
import perFamilyAccount from "../../generated/account";
import type {
  Account,
  DeviceInfo,
  FirmwareUpdateContext,
} from "@ledgerhq/types-live";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";

export type State = {
  isLoading: boolean;
  requestQuitApp: boolean;
  requestOpenApp: string | null | undefined;
  requiresAppInstallation:
    | {
        appName: string;
        appNames: string[];
      }
    | null
    | undefined;
  opened: boolean;
  appAndVersion: AppAndVersion | null | undefined;
  unresponsive: boolean;
  allowOpeningRequestedWording: string | null | undefined;
  allowOpeningGranted: boolean;
  allowManagerRequestedWording: string | null | undefined;
  allowManagerGranted: boolean;
  device: Device | null | undefined;
  deviceInfo?: DeviceInfo | null | undefined;
  latestFirmware?: FirmwareUpdateContext | null | undefined;
  error: Error | null | undefined;
  derivation:
    | {
        address: string;
      }
    | null
    | undefined;
  displayUpgradeWarning: boolean;
  installingApp?: boolean;
  progress?: number;
  listingApps?: boolean;

  request: AppRequest | undefined;
  installQueue?: string[];
  currentAppOp?: AppOp;
  itemProgress?: number;
  isLocked: boolean;
  skippedAppOps: SkippedAppOp[];
  listedApps?: boolean;
};

export type AppState = State & {
  onRetry: () => void;
  passWarning: () => void;
  inWrongDeviceForAccount:
    | {
        accountName: string;
      }
    | null
    | undefined;
};

export type AppRequest = {
  appName?: string;
  currency?: CryptoCurrency | null;
  account?: Account;
  tokenCurrency?: TokenCurrency;
  dependencies?: AppRequest[];
  withInlineInstallProgress?: boolean;
  requireLatestFirmware?: boolean;
  allowPartialDependencies?: boolean;
};

export type AppResult = {
  device: Device;
  appAndVersion: AppAndVersion | null | undefined;
  appName?: string;
  currency?: CryptoCurrency;
  account?: Account;
  tokenCurrency?: TokenCurrency;
  dependencies?: AppRequest[];
  withInlineInstallProgress?: boolean;
  requireLatestFirmware?: boolean;
};

type AppAction = Action<AppRequest, AppState, AppResult>;

type Event =
  | {
      type: "error";
      error: Error;
      device?: Device | null | undefined;
    }
  | {
      type: "deviceChange";
      device: Device | null | undefined;
    }
  | ConnectAppEvent
  | {
      type: "display-upgrade-warning";
      displayUpgradeWarning: boolean;
    };

const mapResult = ({
  opened,
  device,
  appAndVersion,
  displayUpgradeWarning,
}: AppState): AppResult | null | undefined =>
  opened && device && !displayUpgradeWarning
    ? {
        device,
        appAndVersion,
      }
    : null;

const getInitialState = (
  device?: Device | null | undefined,
  request?: AppRequest
): State => ({
  isLoading: !!device,
  requestQuitApp: false,
  requestOpenApp: null,
  unresponsive: false,
  isLocked: false,
  requiresAppInstallation: null,
  allowOpeningRequestedWording: null,
  allowOpeningGranted: false,
  allowManagerRequestedWording: null,
  allowManagerGranted: false,
  device: null,
  deviceInfo: null,
  latestFirmware: null,
  opened: false,
  appAndVersion: null,
  error: null,
  derivation: null,
  displayUpgradeWarning: false,
  installingApp: false,
  listingApps: false,

  request,
  currentAppOp: undefined,
  installQueue: [],
  listedApps: false, // Nb maybe expose the result
  skippedAppOps: [],
  itemProgress: 0,
});

const reducer = (state: State, e: Event): State => {
  switch (e.type) {
    case "unresponsiveDevice":
      return { ...state, unresponsive: true };

    case "lockedDevice":
      return { ...state, isLocked: true };

    // This event does not set isLocked and unresponsive properties, as
    // by itself it does not request anything from the device
    case "device-update-last-seen":
      return {
        ...state,
        deviceInfo: e.deviceInfo,
        latestFirmware: e.latestFirmware,
      };

    case "disconnected":
      return {
        ...getInitialState(null, state.request),
        isLoading: !!e.expected,
      };

    case "deviceChange":
      return { ...getInitialState(e.device, state.request), device: e.device };

    case "some-apps-skipped":
      return {
        ...state,
        skippedAppOps: e.skippedAppOps,
        installQueue: state.installQueue,
      };
    case "inline-install":
      return {
        isLoading: false,
        requestQuitApp: false,
        requiresAppInstallation: null,
        allowOpeningRequestedWording: null,
        allowOpeningGranted: true,
        allowManagerRequestedWording: null,
        allowManagerGranted: true,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        unresponsive: false,
        isLocked: false,
        installingApp: true,
        progress: e.progress || 0,
        requestOpenApp: null,
        listingApps: false,

        request: state.request,
        skippedAppOps: state.skippedAppOps,
        currentAppOp: e.currentAppOp,
        listedApps: state.listedApps,
        itemProgress: e.itemProgress || 0,
        installQueue: e.installQueue || [],
      };

    case "listing-apps":
      return {
        ...state,
        listedApps: false,
        listingApps: true,
        unresponsive: false,
        isLocked: false,
      };

    case "error":
      return {
        ...getInitialState(e.device, state.request),
        device: e.device || null,
        error: e.error,
        isLoading: false,
        listingApps: false,

        request: state.request,
        skippedAppOps: state.skippedAppOps,
      };

    case "ask-open-app":
      return {
        isLoading: false,
        requestQuitApp: false,
        requiresAppInstallation: null,
        allowOpeningRequestedWording: null,
        allowOpeningGranted: false,
        allowManagerRequestedWording: null,
        allowManagerGranted: false,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        unresponsive: false,
        isLocked: false,
        requestOpenApp: e.appName,

        request: state.request,
        skippedAppOps: state.skippedAppOps,
      };

    case "ask-quit-app":
      return {
        isLoading: false,
        requestOpenApp: null,
        requiresAppInstallation: null,
        allowOpeningRequestedWording: null,
        allowOpeningGranted: false,
        allowManagerRequestedWording: null,
        allowManagerGranted: false,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        unresponsive: false,
        isLocked: false,
        requestQuitApp: true,

        request: state.request,
        skippedAppOps: state.skippedAppOps,
      };

    case "device-permission-requested":
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
        isLocked: false,
        allowOpeningGranted: false,
        allowOpeningRequestedWording: null,
        allowManagerGranted: false,
        allowManagerRequestedWording: e.wording,

        request: state.request,
        skippedAppOps: state.skippedAppOps,
        installQueue: state.installQueue,
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
        isLocked: false,
        allowOpeningGranted: true,
        allowOpeningRequestedWording: null,
        allowManagerGranted: true,
        allowManagerRequestedWording: null,

        request: state.request,
        skippedAppOps: state.skippedAppOps,
        installQueue: state.installQueue,
        listedApps: state.listedApps,
      };

    case "app-not-installed":
      return {
        requestQuitApp: false,
        requestOpenApp: null,
        device: state.device,
        opened: false,
        appAndVersion: null,
        error: null,
        derivation: null,
        displayUpgradeWarning: false,
        isLoading: false,
        unresponsive: false,
        isLocked: false,
        allowOpeningGranted: false,
        allowOpeningRequestedWording: null,
        allowManagerGranted: false,
        allowManagerRequestedWording: null,
        requiresAppInstallation: {
          appNames: e.appNames,
          appName: e.appName,
        },

        request: state.request,
        skippedAppOps: state.skippedAppOps,
      };

    case "listed-apps":
      return {
        ...state,
        listedApps: true,
        installQueue: e.installQueue,
      };

    case "opened":
      return {
        requestQuitApp: false,
        requestOpenApp: null,
        requiresAppInstallation: null,
        allowOpeningGranted: false,
        allowOpeningRequestedWording: null,
        allowManagerGranted: false,
        allowManagerRequestedWording: null,
        device: state.device,
        error: null,
        isLoading: false,
        unresponsive: false,
        isLocked: false,
        opened: true,
        appAndVersion: e.app,
        derivation: e.derivation,

        request: state.request,
        skippedAppOps: state.skippedAppOps,
        listedApps: state.listedApps,
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

  const { account, requireLatestFirmware, allowPartialDependencies } =
    appRequest;
  let { appName, currency, dependencies } = appRequest;

  if (!currency && account) {
    currency = account.currency;
  }

  if (!appName && currency) {
    appName = currency.managerAppName;
  }

  invariant(appName, "appName or currency or account is missing");

  if (dependencies) {
    dependencies = dependencies.map((d) => inferCommandParams(d).appName);
  }

  if (!currency) {
    return {
      appName,
      dependencies,
      requireLatestFirmware,
      allowPartialDependencies,
    };
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
      getDerivationScheme({
        currency,
        derivationMode,
      }),
      currency
    );
  }

  return {
    appName,
    dependencies,
    requireLatestFirmware,
    requiresDerivation: {
      derivationMode,
      path: derivationPath,
      currencyId: currency.id,
      ...extra,
    },
    allowPartialDependencies,
  };
}

const DISCONNECT_DEBOUNCE = 5000;
const implementations = {
  // in this paradigm, we know that deviceSubject is reflecting the device events
  // so we just trust deviceSubject to reflect the device context (switch between apps, dashboard,...)
  event: ({ deviceSubject, connectApp, params }) =>
    deviceSubject.pipe(
      // debounce a bit the disconnect events that we don't need
      debounce((device) => timer(!device ? DISCONNECT_DEBOUNCE : 0)),
      switchMap((device) =>
        concat(
          of({
            type: "deviceChange",
            device,
          }),
          connectApp(device, params)
        )
      )
    ),
  // in this paradigm, we can't observe directly the device, so we have to poll it
  polling: ({ deviceSubject, params, connectApp }) =>
    Observable.create((o) => {
      const POLLING = 2000;
      const INIT_DEBOUNCE = 5000;
      const DEVICE_POLLING_TIMEOUT = 20000;
      // this pattern allows to actually support events based (like if deviceSubject emits new device changes) but inside polling paradigm
      let pollingOnDevice;
      const sub = deviceSubject.subscribe((d) => {
        if (d) {
          pollingOnDevice = d;
        }
      });
      let initT: NodeJS.Timeout | null = setTimeout(() => {
        // initial timeout to unset the device if it's still not connected
        o.next({
          type: "deviceChange",
          device: null,
        });
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
              const productName = getDeviceModel(
                pollingOnDevice.modelId
              ).productName;
              return err instanceof TimeoutError
                ? of({
                    type: "error",
                    error: new ConnectAppTimeout(undefined, {
                      productName,
                    }) as Error,
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
                  o.next({
                    type: "deviceChange",
                    device,
                  });
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

export let currentMode: keyof typeof implementations = "event";

export function setDeviceMode(mode: keyof typeof implementations): void {
  currentMode = mode;
}

export const createAction = (
  connectAppExec: (arg0: ConnectAppInput) => Observable<ConnectAppEvent>
): AppAction => {
  const useHook = (
    device: Device | null | undefined,
    appRequest: AppRequest
  ): AppState => {
    const dependenciesResolvedRef = useRef(false);
    const latestFirmwareResolvedRef = useRef(false);
    const outdatedAppRef = useRef<AppAndVersion>();

    const connectApp = useCallback(
      (device, params) =>
        !device
          ? EMPTY
          : connectAppExec({
              modelId: device.modelId,
              devicePath: device.deviceId,
              ...params,
              dependencies: dependenciesResolvedRef.current
                ? undefined
                : params.dependencies,
              requireLatestFirmware: latestFirmwareResolvedRef.current
                ? undefined
                : params.requireLatestFirmware,
              outdatedApp: outdatedAppRef.current,
            }).pipe(
              tap((e) => {
                if (e.type === "dependencies-resolved") {
                  dependenciesResolvedRef.current = true;
                } else if (e.type === "latest-firmware-resolved") {
                  latestFirmwareResolvedRef.current = true;
                } else if (e.type === "has-outdated-app") {
                  outdatedAppRef.current = e.outdatedApp as AppAndVersion;
                }
              }),
              catchError((error: Error) =>
                of({
                  type: "error",
                  error,
                })
              )
            ),
      []
    );
    // repair modal will interrupt everything and be rendered instead of the background content
    const [state, setState] = useState(() => getInitialState(device));
    const [resetIndex, setResetIndex] = useState(0);
    const deviceSubject = useReplaySubject(device);
    const params = useMemo(
      () => inferCommandParams(appRequest), // for now i don't have better
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        appRequest.appName, // eslint-disable-next-line react-hooks/exhaustive-deps
        appRequest.account && appRequest.account.id, // eslint-disable-next-line react-hooks/exhaustive-deps
        appRequest.currency && appRequest.currency.id,
      ]
    );

    useEffect(() => {
      if (state.opened) return;
      const impl = implementations[currentMode];
      const sub = impl({
        deviceSubject,
        connectApp,
        params,
      })
        .pipe(
          tap((e: Event) => log("actions-app-event", e.type, e)), // tap(e => console.log("connectApp event", e)),
          // we gather all events with a reducer into the UI state
          scan(reducer, getInitialState()), // tap((s) => console.log("connectApp state", s)),
          // we debounce the UI state to not blink on the UI
          debounce((s: State) => {
            if (
              s.allowOpeningRequestedWording ||
              s.allowOpeningGranted ||
              s.deviceInfo
            ) {
              // no debounce for allow event
              return EMPTY;
            }

            // default debounce (to be tweak)
            return interval(2000);
          }),
          takeWhile((s: State) => !s.requiresAppInstallation && !s.error, true)
        ) // the state simply goes into a React state
        .subscribe(setState);
      // FIXME shouldn't we handle errors?! (is an error possible?)
      return () => {
        sub.unsubscribe();
      };
    }, [params, deviceSubject, state.opened, resetIndex, connectApp]);
    const onRetry = useCallback(() => {
      // After an error we can't guarantee dependencies are resolved
      dependenciesResolvedRef.current = false;
      latestFirmwareResolvedRef.current = false;
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
          ? state.derivation.address !== appRequest.account.freshAddress &&
            state.derivation.address !== appRequest.account.seedIdentifier // Use-case added for Hedera
            ? {
                accountName: getAccountName(appRequest.account),
              }
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
