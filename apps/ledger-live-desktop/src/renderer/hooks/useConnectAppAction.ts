import { useMemo } from "react";
import { catchError, throwError } from "rxjs";
import { GenuineCheckFailed } from "@ledgerhq/live-common/errors";
import { isCounterfeitError } from "@ledgerhq/live-common/hw/isCounterfeitError";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import connectManager from "@ledgerhq/live-common/hw/connectManager";
import startExchange from "@ledgerhq/live-common/exchange/platform/startExchange";
import {
  AppRequest,
  AppResult,
  AppState,
  createAction as createAppAction,
} from "@ledgerhq/live-common/hw/actions/app";
import {
  ManagerRequest,
  Result as ManagerResult,
  ManagerState,
  createAction as createManagerAction,
} from "@ledgerhq/live-common/hw/actions/manager";
import { createAction as createTransactionAction } from "@ledgerhq/live-common/hw/actions/transaction";
import { createAction as createRawTransactionAction } from "@ledgerhq/live-common/hw/actions/rawTransaction";
import { createAction as createStartExchangeAction } from "@ledgerhq/live-common/hw/actions/startExchange";
import { getEnv } from "@shared/env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { Action } from "@ledgerhq/live-common/hw/actions/types";
import { isDeviceNotOnboardedError } from "@ledgerhq/live-common/device-action/utils";

/**
 * This hook creates an action for connecting to an app on a Ledger device.
 * It uses the `connectApp` function from the `@ledgerhq/live-common` library.
 * The action is created based on whether the environment is in "MOCK" mode or not.
 * If in "MOCK" mode, it uses a mocked event emitter; otherwise, it uses the real `connectApp` function.
 *
 * @returns {Action<AppRequest, AppState, AppResult>} The action for connecting to an app.
 */
export default function useConnectAppAction({
  allowNonOnboardedDevice = false,
}: {
  allowNonOnboardedDevice?: boolean;
} = {}): Action<AppRequest, AppState, AppResult> {
  const action = useMemo(
    () =>
      createAppAction(
        getEnv("MOCK") ? mockedEventEmitter : connectApp({ allowNonOnboardedDevice }),
      ),
    [allowNonOnboardedDevice],
  );
  return action;
}

export function useTransactionAction() {
  const action = useMemo(
    () => createTransactionAction(getEnv("MOCK") ? mockedEventEmitter : connectApp()),
    [],
  );
  return action;
}

export function useRawTransactionAction() {
  const action = useMemo(
    () => createRawTransactionAction(getEnv("MOCK") ? mockedEventEmitter : connectApp()),
    [],
  );
  return action;
}

export function useStartExchangeAction() {
  const action = useMemo(
    () =>
      createStartExchangeAction(getEnv("MOCK") ? mockedEventEmitter : connectApp(), startExchange),
    [],
  );
  return action;
}

export function useConnectManagerAction(): Action<ManagerRequest, ManagerState, ManagerResult> {
  const action = useMemo(
    () => createManagerAction(getEnv("MOCK") ? mockedEventEmitter : connectManager()),
    [],
  );
  return action;
}

/**
 * Variant of useConnectManagerAction for the onboarding genuine check.
 * Wraps all unhandled connectManager errors as GenuineCheckFailed so that
 * arbitrary device/proxy errors are presented uniformly to the user.
 */
export function useGenuineCheckAction(): Action<ManagerRequest, ManagerState, ManagerResult> {
  return useMemo(() => {
    if (getEnv("MOCK")) {
      return createManagerAction(mockedEventEmitter);
    }
    const task: Parameters<typeof createManagerAction>[0] = input =>
      connectManager()(input).pipe(
        catchError(error => {
          if (isCounterfeitError(error)) return throwError(() => error);
          if (isDeviceNotOnboardedError(error)) return throwError(() => error);

          return throwError(() => new GenuineCheckFailed("", { cause: error }));
        }),
      );
    return createManagerAction(task);
  }, []);
}
