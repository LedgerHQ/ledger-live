import { Observable, of, concat } from "rxjs";
import { map, scan, tap } from "rxjs/operators";
import { useEffect, useState, useMemo } from "react";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import type { Action, Device } from "./types";
import type { AppRequest, AppState } from "./app";
import { log } from "@ledgerhq/logs";
import { createAction as createAppAction } from "./app";
import { ExchangeType } from "@ledgerhq/live-app-sdk";
import { getMainAccount } from "../../account";
import { isExchangeSwap, type Exchange } from "../../exchange/types";
import { isSwapDisableAppsInstall } from "../../exchange/swap/utils/isIntegrationTestEnv";

export type StartExchangeSuccessResult = {
  nonce: string;
  device: Device;
  exchangeAppVersion?: string;
  signingAppName?: string;
  signingAppVersion?: string;
};

export type StartExchangeErrorResult = {
  error: Error;
  device?: Device;
};

type State = {
  startExchangeResult: StartExchangeSuccessResult | null | undefined;
  startExchangeError: StartExchangeErrorResult | null | undefined;
  freezeReduxDevice: boolean;
  isLoading: boolean;
  error?: Error; //NB connectApp errors
};

type StartExchangeState = AppState & State;
type StartExchangeRequest = { exchangeType: ExchangeType; provider?: string; exchange?: Exchange };
export type Result =
  | {
      startExchangeResult: StartExchangeSuccessResult;
    }
  | {
      startExchangeError: StartExchangeErrorResult;
    };

type StartExchangeAction = Action<any, StartExchangeState, Result>;
export type ExchangeRequestEvent =
  | { type: "start-exchange" }
  | { type: "start-exchange-error"; startExchangeError: StartExchangeErrorResult }
  | { type: "start-exchange-result"; startExchangeResult: StartExchangeSuccessResult };

const mapResult = ({
  startExchangeResult,
  startExchangeError,
}: StartExchangeState): Result | null | undefined =>
  startExchangeResult
    ? {
        startExchangeResult,
      }
    : startExchangeError
      ? {
          startExchangeError,
        }
      : null;

const initialState: State = {
  startExchangeResult: null,
  startExchangeError: null,
  freezeReduxDevice: false,
  isLoading: false,
};

const reducer = (state: State, e: ExchangeRequestEvent) => {
  switch (e.type) {
    case "start-exchange":
      return { ...state, freezeReduxDevice: true };

    case "start-exchange-error":
      return { ...state, startExchangeError: e.startExchangeError, isLoading: false };

    case "start-exchange-result":
      return {
        ...state,
        startExchangeResult: e.startExchangeResult,
        isLoading: false,
      };
  }
};

function useFrozenValue<T>(value: T, frozen: boolean): T {
  const [state, setState] = useState(value);
  useEffect(() => {
    if (!frozen) {
      setState(value);
    }
  }, [value, frozen]);
  return state;
}

export const createAction = (
  connectAppExec: (arg0: ConnectAppInput) => Observable<ConnectAppEvent>,
  startExchangeExec: (arg0: {
    device: Device;
    exchangeType: ExchangeType;
    appVersion?: string;
    provider?: string;
  }) => Observable<ExchangeRequestEvent>,
): StartExchangeAction => {
  const useHook = (
    reduxDevice: Device | null | undefined,
    startExchangeRequest: StartExchangeRequest,
  ): StartExchangeState => {
    const [state, setState] = useState(initialState);
    const reduxDeviceFrozen = useFrozenValue(reduxDevice, state.freezeReduxDevice);

    const { exchangeType, provider, exchange } = startExchangeRequest;
    const requireLatestFirmware = true;

    const mainFromAccount = exchange
      ? getMainAccount(exchange.fromAccount, exchange.fromParentAccount)
      : null;
    const mainToAccount =
      exchange && isExchangeSwap(exchange)
        ? getMainAccount(exchange.toAccount, exchange.toParentAccount)
        : null;

    const request = useMemo<AppRequest>(() => {
      if (isSwapDisableAppsInstall()) {
        return {
          appName: "Exchange",
        };
      }
      const dependencies: AppRequest["dependencies"] = [];
      if (mainFromAccount) {
        dependencies.push({ appName: mainFromAccount?.currency?.managerAppName });
      }

      if (mainToAccount) {
        dependencies.push({ appName: mainToAccount?.currency?.managerAppName });
      }

      const shouldAddEthApp =
        (mainFromAccount?.currency?.family === "evm" ||
          mainToAccount?.currency?.family === "evm") &&
        mainFromAccount?.currency?.managerAppName !== "Ethereum" &&
        mainToAccount?.currency?.managerAppName !== "Ethereum";

      // Check if we should add ETH app, for cases like when we want AVAX to use the ETH app.
      if (shouldAddEthApp) {
        dependencies.push({
          appName: "Ethereum",
        });
      }

      return {
        appName: "Exchange",
        dependencies,
        requireLatestFirmware,
      };
    }, [mainFromAccount, mainToAccount, requireLatestFirmware]);

    const appState = createAppAction(connectAppExec).useHook(reduxDeviceFrozen, request);

    const { device, opened, error, appAndVersion, installedAppVersions } = appState;
    const signingAppName = mainFromAccount?.currency?.managerAppName || undefined;
    const signingAppVersion = signingAppName
      ? installedAppVersions?.find(app => app.name === signingAppName)?.version
      : undefined;

    const hasError = error || state.error;
    useEffect(() => {
      if (!opened || !device) {
        // isLoading should be false until we have a device to show the correct animation
        setState({ ...initialState, isLoading: device ? !hasError : false });
        return;
      }

      const sub = concat(
        of(<ExchangeRequestEvent>{
          type: "start-exchange",
        }),
        startExchangeExec({
          device,
          exchangeType,
          provider,
          appVersion: appAndVersion?.version,
        }),
      )
        .pipe(
          map(event =>
            event.type === "start-exchange-result"
              ? {
                  ...event,
                  startExchangeResult: {
                    ...event.startExchangeResult,
                    ...(appAndVersion?.version
                      ? { exchangeAppVersion: appAndVersion.version }
                      : {}),
                    ...(signingAppName ? { signingAppName } : {}),
                    ...(signingAppVersion ? { signingAppVersion } : {}),
                  },
                }
              : event,
          ),
          tap(e => {
            log("actions-startExchange-event", JSON.stringify(e));
          }),
          scan(reducer, initialState),
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [
      exchange,
      device,
      opened,
      exchangeType,
      hasError,
      appAndVersion,
      provider,
      signingAppName,
      signingAppVersion,
    ]);

    return {
      ...appState,
      ...state,
    } as StartExchangeState;
  };

  return {
    useHook,
    mapResult,
  };
};
