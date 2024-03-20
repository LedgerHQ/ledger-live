import { useMemo } from "react";
import { createAction as appCreateAction } from "@ledgerhq/live-common/hw/actions/app";
import { createAction as transactionCreateAction } from "@ledgerhq/live-common/hw/actions/transaction";
import { createAction as startExchangeCreateAction } from "@ledgerhq/live-common/hw/actions/startExchange";
import { createAction as initSwapCreateAction } from "@ledgerhq/live-common/hw/actions/initSwap";
import { createAction as managerCreateAction } from "@ledgerhq/live-common/hw/actions/manager";
import { createAction as signMessageCreateAction } from "@ledgerhq/live-common/hw/signMessage/index";
import { createAction as completeExchangeCreateAction } from "@ledgerhq/live-common/hw/actions/completeExchange";
import { createAction as staxLoadImageCreateAction } from "@ledgerhq/live-common/hw/actions/staxLoadImage";
import { createAction as staxFetchImageCreateAction } from "@ledgerhq/live-common/hw/actions/staxFetchImage";
import { createAction as installLanguageCreateAction } from "@ledgerhq/live-common/hw/actions/installLanguage";
import { createAction as staxRemoveImageCreateAction } from "@ledgerhq/live-common/hw/actions/staxRemoveImage";
import { createAction as renameDeviceCreateAction } from "@ledgerhq/live-common/hw/actions/renameDevice";
import renameDevice from "@ledgerhq/live-common/hw/renameDevice";
import staxLoadImage from "@ledgerhq/live-common/hw/staxLoadImage";
import installLanguage from "@ledgerhq/live-common/hw/installLanguage";
import staxFetchImage from "@ledgerhq/live-common/hw/staxFetchImage";
import staxRemoveImage from "@ledgerhq/live-common/hw/staxRemoveImage";
import connectManager from "@ledgerhq/live-common/hw/connectManager";
import initSwap from "@ledgerhq/live-common/exchange/swap/initSwap";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import startExchange from "@ledgerhq/live-common/exchange/platform/startExchange";
import completeExchange from "@ledgerhq/live-common/exchange/platform/completeExchange";
import {
  connectAppExecMock,
  initSwapExecMock,
  connectManagerExecMock,
  staxFetchImageExecMock,
  startExchangeExecMock,
  completeExchangeExecMock,
  installLanguageExecMock,
  staxLoadImageExecMock,
  staxRemoveImageExecMock,
  renameDeviceExecMock,
} from "../../e2e/bridge/types";

export function useAppDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(() => appCreateAction(mock ? connectAppExecMock : connectApp), [mock]);
}

export function useTransactionDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(() => transactionCreateAction(mock ? connectAppExecMock : connectApp), [mock]);
}

export function useInitSwapDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(
    () =>
      mock
        ? initSwapCreateAction(connectAppExecMock, initSwapExecMock)
        : initSwapCreateAction(connectApp, initSwap),
    [mock],
  );
}

export function useManagerDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(() => managerCreateAction(mock ? connectManagerExecMock : connectManager), [mock]);
}

export function useSignMessageDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(() => signMessageCreateAction(mock ? connectAppExecMock : connectApp), [mock]);
}

export function useInstallLanguageDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(
    () => installLanguageCreateAction(mock ? installLanguageExecMock : installLanguage),
    [mock],
  );
}

export function useStaxLoadImageDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(
    () => staxLoadImageCreateAction(mock ? staxLoadImageExecMock : staxLoadImage),
    [mock],
  );
}

export function useStaxFetchImageDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(
    () => staxFetchImageCreateAction(mock ? staxFetchImageExecMock : staxFetchImage),
    [mock],
  );
}

export function useStaxRemoveImageDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(
    () => staxRemoveImageCreateAction(mock ? staxRemoveImageExecMock : staxRemoveImage),
    [mock],
  );
}

export function useStartExchangeDeviceAction() {
  const mock = useEnv("MOCK");
  return useMemo(
    () =>
      mock
        ? startExchangeCreateAction(connectAppExecMock, startExchangeExecMock)
        : startExchangeCreateAction(connectApp, startExchange),
    [mock],
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
