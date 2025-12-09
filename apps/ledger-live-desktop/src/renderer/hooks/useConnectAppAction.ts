import { useMemo } from "react";
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
import { getEnv } from "@ledgerhq/live-env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Action } from "@ledgerhq/live-common/hw/actions/types";

/**
 * This hook creates an action for connecting to an app on a Ledger device.
 * It uses the `connectApp` function from the `@ledgerhq/live-common` library.
 * The action is created based on whether the environment is in "MOCK" mode or not.
 * If in "MOCK" mode, it uses a mocked event emitter; otherwise, it uses the real `connectApp` function.
 *
 * @returns {Action<AppRequest, AppState, AppResult>} The action for connecting to an app.
 */
export default function useConnectAppAction(): Action<AppRequest, AppState, AppResult> {
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  return useMemo(
    () =>
      createAppAction(
        getEnv("MOCK") ? mockedEventEmitter : connectApp({ isLdmkConnectAppEnabled }),
      ),
    [isLdmkConnectAppEnabled],
  );
}

export function useTransactionAction() {
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  return useMemo(
    () =>
      createTransactionAction(
        getEnv("MOCK") ? mockedEventEmitter : connectApp({ isLdmkConnectAppEnabled }),
      ),
    [isLdmkConnectAppEnabled],
  );
}

export function useRawTransactionAction() {
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  return useMemo(
    () =>
      createRawTransactionAction(
        getEnv("MOCK") ? mockedEventEmitter : connectApp({ isLdmkConnectAppEnabled }),
      ),
    [isLdmkConnectAppEnabled],
  );
}

export function useStartExchangeAction() {
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  return useMemo(
    () =>
      createStartExchangeAction(
        getEnv("MOCK") ? mockedEventEmitter : connectApp({ isLdmkConnectAppEnabled }),
        startExchange,
      ),
    [isLdmkConnectAppEnabled],
  );
}

export function useConnectManagerAction(): Action<ManagerRequest, ManagerState, ManagerResult> {
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  return useMemo(
    () =>
      createManagerAction(
        getEnv("MOCK") ? mockedEventEmitter : connectManager({ isLdmkConnectAppEnabled }),
      ),
    [isLdmkConnectAppEnabled],
  );
}
