import invariant from "invariant";
import { interval, Observable, of } from "rxjs";
import { scan, debounce, tap, takeWhile } from "rxjs/operators";
import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { log } from "@ledgerhq/logs";
import {
  getDerivationScheme,
  getDerivationModesForCurrency,
  runDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import type {
  AppAndVersion,
  ConnectAppEvent,
  ConnectAppRequest,
  Input as ConnectAppInput,
} from "../connectApp";
import { useReplaySubject } from "../../observable";
import { getAccountName } from "../../account";
import type { Device, Action } from "./types";
import { shouldUpgrade } from "../../apps";
import { AppOp, SkippedAppOp } from "../../apps/types";
import perFamilyAccount from "../../generated/account";
import type { Account, DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getImplementation, ImplementationType } from "./implementations";

export type State = {
  isLoading: boolean;
  isDisconnected: boolean;
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
  allowManagerRequested: boolean;
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

export type Event =
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

const getInitialState = (device?: Device | null | undefined, request?: AppRequest): State => ({
  isLoading: !!device,
  isDisconnected: false,
  requestQuitApp: false,
  requestOpenApp: null,
  unresponsive: false,
  isLocked: false,
  requiresAppInstallation: null,
  allowOpeningRequestedWording: null,
  allowOpeningGranted: false,
  allowManagerRequested: false,
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
  progress: undefined,
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
      // disconnected event can happen for example:
      // - when the wired device is unplugged
      // - before a ask-open-app event when an other app is already open
      return {
        ...getInitialState(null, state.request),
        isLoading: !!e.expected,
        isDisconnected: true,
      };

    case "deviceChange":
      // Preserve the current state when the device is disconnected to avoid displaying
      // the loader drawer above the disconnected one.
      if (state.isDisconnected) return state;

      return {
        ...getInitialState(e.device, state.request),
        device: e.device,
      };

    case "some-apps-skipped":
      return {
        ...state,
        skippedAppOps: e.skippedAppOps,
        installQueue: state.installQueue,
      };
    case "inline-install":
      return {
        ...getInitialState(state.device, state.request),
        isLoading: false,
        allowOpeningGranted: true,
        allowManagerRequested: false,
        allowManagerGranted: true,
        device: state.device,
        installingApp: true,
        progress: e.progress || 0,

        deviceInfo: undefined,
        latestFirmware: undefined,

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
      // Preserve the current state when the device is disconnected to avoid displaying
      // an additional error message above the disconnected one.
      if (state.isDisconnected) return state;

      return {
        ...getInitialState(state.device, state.request),
        device: state.device || null,
        error: e.error,
        isLoading: false,
        listingApps: false,

        request: state.request,
        skippedAppOps: state.skippedAppOps,
      };

    case "ask-open-app":
      return {
        ...getInitialState(state.device, state.request),
        isLoading: false,
        device: state.device,
        requestOpenApp: e.appName,

        deviceInfo: undefined,
        latestFirmware: undefined,
        installingApp: undefined,
        listingApps: undefined,
        installQueue: undefined,
        listedApps: undefined,
        itemProgress: undefined,

        skippedAppOps: state.skippedAppOps,
      };

    case "ask-quit-app":
      return {
        ...getInitialState(state.device, state.request),
        isLoading: false,
        device: state.device,
        requestQuitApp: true,

        installingApp: undefined,
        listingApps: undefined,
        installQueue: undefined,
        listedApps: undefined,
        itemProgress: undefined,

        skippedAppOps: state.skippedAppOps,
      };

    case "device-permission-requested":
      return {
        ...getInitialState(state.device, state.request),
        isLoading: false,
        device: state.device,
        allowManagerRequested: true,

        deviceInfo: undefined,
        latestFirmware: undefined,
        installingApp: undefined,
        listingApps: undefined,
        listedApps: undefined,
        itemProgress: undefined,

        skippedAppOps: state.skippedAppOps,
        installQueue: state.installQueue,
      };

    case "device-permission-granted":
      return {
        ...getInitialState(state.device, state.request),
        isLoading: false,
        device: state.device,
        allowOpeningGranted: true,
        allowManagerGranted: true,

        deviceInfo: undefined,
        latestFirmware: undefined,
        installingApp: undefined,
        listingApps: undefined,
        itemProgress: undefined,

        skippedAppOps: state.skippedAppOps,
        installQueue: state.installQueue,
        listedApps: state.listedApps,
      };

    case "app-not-installed":
      return {
        ...getInitialState(state.device, state.request),
        isLoading: false,
        device: state.device,
        requiresAppInstallation: {
          appNames: e.appNames,
          appName: e.appName,
        },

        deviceInfo: undefined,
        latestFirmware: undefined,
        installingApp: undefined,
        listingApps: undefined,
        installQueue: undefined,
        listedApps: undefined,
        itemProgress: undefined,

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
        ...getInitialState(state.device, state.request),
        isLoading: false,
        device: state.device,
        opened: true,
        appAndVersion: e.app,
        derivation: e.derivation,

        deviceInfo: undefined,
        latestFirmware: undefined,
        installingApp: undefined,
        listingApps: undefined,
        installQueue: undefined,
        itemProgress: undefined,

        request: state.request,
        skippedAppOps: state.skippedAppOps,
        listedApps: state.listedApps,
        displayUpgradeWarning:
          state.device && e.app ? shouldUpgrade(e.app.name, e.app.version) : false,
      };
  }

  return state;
};

/**
 * Map between an AppRequest and a ConnectAppRequest, allowing us to
 * specify an account or a currency without resolving manually the actual
 * applications we depend on in order to access the flow.
 */
function inferCommandParams(appRequest: AppRequest) {
  let derivationMode;
  let derivationPath;

  const { account, requireLatestFirmware, allowPartialDependencies } = appRequest;
  let { appName, currency, dependencies } = appRequest;

  if (!currency && account) {
    currency = account.currency;
  }

  if (!appName && currency) {
    appName = currency.managerAppName;
  }

  invariant(appName, "appName or currency or account is missing");

  if (dependencies) {
    dependencies = dependencies.map(d => inferCommandParams(d).appName);
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
      currency,
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

export let currentMode: keyof typeof ImplementationType = "event";
export function setDeviceMode(mode: keyof typeof ImplementationType): void {
  currentMode = mode;
}

export const createAction = (
  connectAppExec: (arg0: ConnectAppInput) => Observable<ConnectAppEvent>,
): AppAction => {
  const useHook = (device: Device | null | undefined, appRequest: AppRequest): AppState => {
    const dependenciesResolvedRef = useRef(false);
    const firmwareResolvedRef = useRef(false);
    const outdatedAppRef = useRef<AppAndVersion>();

    const request: ConnectAppRequest = useMemo(
      () => inferCommandParams(appRequest), // for now i don't have better
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        appRequest.appName, // eslint-disable-next-line react-hooks/exhaustive-deps
        appRequest.account && appRequest.account.id, // eslint-disable-next-line react-hooks/exhaustive-deps
        appRequest.currency && appRequest.currency.id,
        appRequest.dependencies,
      ],
    );

    const task: (arg0: ConnectAppInput) => Observable<ConnectAppEvent> = useCallback(
      ({ deviceId, request }: ConnectAppInput) => {
        //To avoid redundant checks, we remove passed checks from the request.
        const { dependencies, requireLatestFirmware } = request;

        return connectAppExec({
          deviceId,
          request: {
            ...request,
            dependencies: dependenciesResolvedRef.current ? undefined : dependencies,
            requireLatestFirmware: firmwareResolvedRef.current ? undefined : requireLatestFirmware,
            outdatedApp: outdatedAppRef.current,
          },
        }).pipe(
          tap(e => {
            // These events signal the resolution of pending checks.
            if (e.type === "dependencies-resolved") {
              dependenciesResolvedRef.current = true;
            } else if (e.type === "latest-firmware-resolved") {
              firmwareResolvedRef.current = true;
            } else if (e.type === "has-outdated-app") {
              outdatedAppRef.current = e.outdatedApp as AppAndVersion;
            }
          }),
        );
      },
      [],
    );

    // repair modal will interrupt everything and be rendered instead of the background content
    const [state, setState] = useState(() => getInitialState(device));
    const [resetIndex, setResetIndex] = useState(0);
    const deviceSubject = useReplaySubject(device);

    useEffect(() => {
      if (state.opened) return;

      const impl = getImplementation(currentMode)<ConnectAppEvent, ConnectAppRequest>({
        deviceSubject,
        task,
        request,
      });

      const sub = impl
        .pipe(
          tap((e: any) => log("actions-app-event", e.type, e)),
          debounce((e: Event) => ("replaceable" in e && e.replaceable ? interval(100) : of(null))),
          scan(reducer, getInitialState()),
          takeWhile((s: State) => !s.requiresAppInstallation && !s.error, true),
        )
        .subscribe(setState);

      return () => {
        sub.unsubscribe();
      };
    }, [deviceSubject, state.opened, resetIndex, task, request]);

    const onRetry = useCallback(() => {
      // After an error we can't guarantee resolutions.
      dependenciesResolvedRef.current = false;
      firmwareResolvedRef.current = false;

      // The nonce change triggers a refresh.
      setResetIndex(i => i + 1);
      setState(getInitialState(device));
    }, [device]);

    const passWarning = useCallback(() => {
      setState(currState => ({
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
