import { useCallback, useMemo, useRef, useState } from "react";
import { createAction as appCreateAction } from "@ledgerhq/live-common/hw/actions/app";
import { createAction as transactionCreateAction } from "@ledgerhq/live-common/hw/actions/transaction";
import { createAction as rawTransactionCreateAction } from "@ledgerhq/live-common/hw/actions/rawTransaction";
import { createAction as startExchangeCreateAction } from "@ledgerhq/live-common/hw/actions/startExchange";
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
import connectAppFactory from "@ledgerhq/live-common/hw/connectApp";
import { withOsUpdatesResolution } from "LLM/features/OsUpdate/hooks/useResolveOsUpdates/withOsUpdatesResolution";
import startExchange from "@ledgerhq/live-common/exchange/platform/startExchange";
import completeExchange from "@ledgerhq/live-common/exchange/platform/completeExchange";

export function useAppDeviceAction({
  allowNonOnboardedDevice = false,
}: {
  allowNonOnboardedDevice?: boolean;
} = {}) {
  return useMemo(
    () => appCreateAction(connectAppFactory({ allowNonOnboardedDevice })),
    [allowNonOnboardedDevice],
  );
}

export function useTransactionDeviceAction() {
  return useMemo(() => transactionCreateAction(connectAppFactory()), []);
}

export function useRawTransactionDeviceAction() {
  return useMemo(() => rawTransactionCreateAction(connectAppFactory()), []);
}

type ManagerDeviceActionOptions = {
  /** Resolve the OS update path before emitting the result (only when `ldmkOsUpdates` is enabled). */
  resolveOsUpdates?: boolean;
};

export function useManagerDeviceAction({
  resolveOsUpdates = false,
}: ManagerDeviceActionOptions = {}) {
  return useMemo(() => {
    const action = managerCreateAction(connectManagerFactory());
    return resolveOsUpdates ? withOsUpdatesResolution(action) : action;
  }, [resolveOsUpdates]);
}

export function useSignMessageDeviceAction() {
  return useMemo(() => signMessageCreateAction(connectAppFactory()), []);
}

export function useInstallLanguageDeviceAction() {
  return useMemo(() => installLanguageCreateAction(installLanguage), []);
}

export function useLoadImageDeviceAction() {
  return useMemo(() => loadImageCreateAction(customLockScreenLoad), []);
}

export function useFetchImageDeviceAction() {
  return useMemo(() => fetchImageCreateAction(customLockScreenFetch), []);
}

export function useRemoveImageDeviceAction() {
  return useMemo(() => removeImageCreateAction(customLockScreenRemove), []);
}

export function useStartExchangeDeviceAction() {
  return useMemo(() => startExchangeCreateAction(connectAppFactory(), startExchange), []);
}

export function useCompleteExchangeDeviceAction() {
  return useMemo(() => completeExchangeCreateAction(completeExchange), []);
}

export function useRenameDeviceAction() {
  return useMemo(() => renameDeviceCreateAction(renameDevice), []);
}

export function useSelectDevice(defaultDevice?: Device) {
  const [device, setDevice] = useState<Device | null | undefined>(defaultDevice || null);

  const onDeviceUpdated = useRef<(() => void) | undefined>(undefined);
  const registerDeviceSelection = useCallback((handler: () => void) => {
    onDeviceUpdated.current = handler;
  }, []);
  const selectDevice = useCallback((device: Device | null | undefined) => {
    setDevice(device);
    onDeviceUpdated.current?.();
  }, []);

  return { device, selectDevice, registerDeviceSelection };
}
