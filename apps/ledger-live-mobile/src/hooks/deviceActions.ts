import { useCallback, useMemo, useRef, useState } from "react";
import { createAction as appCreateAction } from "@ledgerhq/live-common/hw/actions/app";
import { createAction as transactionCreateAction } from "@ledgerhq/live-common/hw/actions/transaction";
import { createAction as rawTransactionCreateAction } from "@ledgerhq/live-common/hw/actions/rawTransaction";
import { createAction as startExchangeCreateAction } from "@ledgerhq/live-common/hw/actions/startExchange";
import { createAction as initSwapCreateAction } from "@ledgerhq/live-common/hw/actions/initSwap";
import { createAction as managerCreateAction } from "@ledgerhq/live-common/hw/actions/manager";
import { createAction as signMessageCreateAction } from "@ledgerhq/live-common/hw/signMessage/index";
import { createAction as completeExchangeCreateAction } from "@ledgerhq/live-common/hw/actions/completeExchange";
import { createAction as loadImageCreateAction } from "@ledgerhq/live-common/hw/actions/customLockScreenLoad";
import { createAction as fetchImageCreateAction } from "@ledgerhq/live-common/hw/actions/customLockScreenFetch";
import { createAction as installLanguageCreateAction } from "@ledgerhq/live-common/hw/actions/installLanguage";
import { createAction as removeImageCreateAction } from "@ledgerhq/live-common/hw/actions/customLockScreenRemove";
import { createAction as renameDeviceCreateAction } from "@ledgerhq/live-common/hw/actions/renameDevice";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import renameDevice from "@ledgerhq/live-common/hw/renameDevice";
import customLockScreenLoad from "@ledgerhq/live-common/hw/customLockScreenLoad";
import installLanguage from "@ledgerhq/live-common/hw/installLanguage";
import customLockScreenFetch from "@ledgerhq/live-common/hw/customLockScreenFetch";
import customLockScreenRemove from "@ledgerhq/live-common/hw/customLockScreenRemove";
import connectManagerFactory from "@ledgerhq/live-common/hw/connectManager";
import initSwap from "@ledgerhq/live-common/exchange/swap/initSwap";
import connectAppFactory from "@ledgerhq/live-common/hw/connectApp";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import startExchange from "@ledgerhq/live-common/exchange/platform/startExchange";
import completeExchange from "@ledgerhq/live-common/exchange/platform/completeExchange";
import type { UserId } from "@ledgerhq/identities";
import type { InitSwapInput, SwapRequestEvent } from "@ledgerhq/live-common/exchange/swap/types";
import { Observable } from "rxjs";
import {
  connectAppExecMock,
  initSwapExecMock,
  connectManagerExecMock,
  fetchImageExecMock,
  startExchangeExecMock,
  completeExchangeExecMock,
  installLanguageExecMock,
  loadImageExecMock,
  removeImageExecMock,
  renameDeviceExecMock,
} from "../../e2e/bridge/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

export function useAppDeviceAction() {
  const envMock = useEnv("MOCK");
  const deviceProxy = useEnv("DEVICE_PROXY_URL");
  const mock = envMock && !deviceProxy;
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  return useMemo(
    () =>
      appCreateAction(mock ? connectAppExecMock : connectAppFactory({ isLdmkConnectAppEnabled })),
    [isLdmkConnectAppEnabled, mock],
  );
}

export function useTransactionDeviceAction() {
  const mock = useEnv("MOCK");
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  return useMemo(
    () =>
      transactionCreateAction(
        mock ? connectAppExecMock : connectAppFactory({ isLdmkConnectAppEnabled }),
      ),
    [isLdmkConnectAppEnabled, mock],
  );
}

export function useRawTransactionDeviceAction() {
  const mock = useEnv("MOCK");
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  return useMemo(
    () =>
      rawTransactionCreateAction(
        mock ? connectAppExecMock : connectAppFactory({ isLdmkConnectAppEnabled }),
      ),
    [isLdmkConnectAppEnabled, mock],
  );
}

export function useInitSwapDeviceAction(userId: UserId) {
  const mock = useEnv("MOCK");
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  return useMemo(() => {
    const initSwapWithUserId = (input: InitSwapInput): Observable<SwapRequestEvent> =>
      initSwap(input, userId);
    return mock
      ? initSwapCreateAction(connectAppExecMock, initSwapExecMock)
      : initSwapCreateAction(connectAppFactory({ isLdmkConnectAppEnabled }), initSwapWithUserId);
  }, [isLdmkConnectAppEnabled, mock, userId]);
}

export function useManagerDeviceAction() {
  const mock = useEnv("MOCK");
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  return useMemo(
    () =>
      managerCreateAction(
        mock ? connectManagerExecMock : connectManagerFactory({ isLdmkConnectAppEnabled }),
      ),
    [isLdmkConnectAppEnabled, mock],
  );
}

export function useSignMessageDeviceAction() {
  const mock = useEnv("MOCK");
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  return useMemo(
    () =>
      signMessageCreateAction(
        mock ? connectAppExecMock : connectAppFactory({ isLdmkConnectAppEnabled }),
      ),
    [isLdmkConnectAppEnabled, mock],
  );
}

export function useInstallLanguageDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(
    () => installLanguageCreateAction(mock ? installLanguageExecMock : installLanguage),
    [mock],
  );
}

export function useLoadImageDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(
    () => loadImageCreateAction(mock ? loadImageExecMock : customLockScreenLoad),
    [mock],
  );
}

export function useFetchImageDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(
    () => fetchImageCreateAction(mock ? fetchImageExecMock : customLockScreenFetch),
    [mock],
  );
}

export function useRemoveImageDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(
    () => removeImageCreateAction(mock ? removeImageExecMock : customLockScreenRemove),
    [mock],
  );
}

export function useStartExchangeDeviceAction() {
  const mock = useEnv("MOCK");
  const isLdmkConnectAppEnabled = useFeature("ldmkConnectApp")?.enabled ?? false;
  return useMemo(
    () =>
      mock
        ? startExchangeCreateAction(connectAppExecMock, startExchangeExecMock)
        : startExchangeCreateAction(connectAppFactory({ isLdmkConnectAppEnabled }), startExchange),
    [isLdmkConnectAppEnabled, mock],
  );
}

export function useCompleteExchangeDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(
    () => completeExchangeCreateAction(mock ? completeExchangeExecMock : completeExchange),
    [mock],
  );
}

export function useRenameDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(
    () => renameDeviceCreateAction(mock ? renameDeviceExecMock : renameDevice),
    [mock],
  );
}

export function useSelectDevice() {
  const [device, setDevice] = useState<Device | null | undefined>(null);

  const onDeviceUpdated = useRef<() => void>();
  const registerDeviceSelection = useCallback((handler: () => void) => {
    onDeviceUpdated.current = handler;
  }, []);
  const selectDevice = useCallback((device: Device | null | undefined) => {
    setDevice(device);
    onDeviceUpdated.current?.();
  }, []);

  return { device, selectDevice, registerDeviceSelection };
}
