import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { accountsSlice, type AccountsState, type AccountUUID } from "@domain/entity-account";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { selectAccountReceive, type WithAccountReceives } from "@domain/entity-account-receive";
import {
  accountStatusSlice,
  type AccountStatus,
  type AccountStatusState,
} from "@domain/entity-account-status";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import { useAccountData, type UseAccountDataResult } from "@features/platform-account-data";
import { currencyIdFromNetwork } from "@domain/entity-network";
import {
  toReceiveScreenState,
  type ReceiveKindRead,
  type ReceiveScreenState,
} from "../../logic/toReceiveScreenState";

type ReceiveScreenRootState = WithAccountReceives & {
  accountEntries: AccountsState;
  accountStatus: AccountStatusState;
};

/** The screen state; on `error`, `retry` reads the failed kinds again. */
export type ReceiveScreenData =
  | Exclude<ReceiveScreenState, { type: "error" }>
  | Readonly<{ type: "error"; retry: () => void }>;

export type UseReceiveScreenDataResult = Readonly<{
  descriptor: AccountDescriptor | undefined;
  data: ReceiveScreenData;
  /** Absent until it is read. */
  accountStatus: AccountStatus | undefined;
  /**
   * Reads the account's receive and statuses again, once the user may have onboarded or activated,
   * then again while the gate stays: the chain or the sync cache may not show it yet.
   */
  refreshGate: () => void;
}>;

const GATE_FOLLOW_UP_DELAY = 10_000;
const GATE_FOLLOW_UPS = 6;

const { selectAccountEntry } = accountsSlice.getSelectors(
  (state: ReceiveScreenRootState) => state.accountEntries,
);
const { selectAccountStatus, selectAssetStatus } = accountStatusSlice.selectors;

const kindRead = <T>(data: T | undefined, read: UseAccountDataResult): ReceiveKindRead<T> => ({
  data,
  failed: data === undefined && !read.pending && read.error !== undefined,
});

/** Reads no `assetStatus` for the native coin: it has no asset gate. */
export function useReceiveScreenData(
  accountUUID: AccountUUID,
  assetId: CryptoOrTokenCurrencyId,
): UseReceiveScreenDataResult {
  const descriptor = useSelector(
    (state: ReceiveScreenRootState) => selectAccountEntry(state, accountUUID)?.descriptor,
  );
  const isToken = !!descriptor && assetId !== currencyIdFromNetwork(descriptor.network);
  const assetQuery = useMemo(() => ({ assetId }), [assetId]);

  const receiveRead = useAccountData("receive", descriptor);
  const accountStatusRead = useAccountData("accountStatus", descriptor);
  const assetStatusRead = useAccountData("assetStatus", isToken ? descriptor : undefined, {
    query: assetQuery,
  });

  const receive = useSelector((state: ReceiveScreenRootState) =>
    selectAccountReceive(state, accountUUID),
  );
  const accountStatus = useSelector((state: ReceiveScreenRootState) =>
    selectAccountStatus(state, accountUUID),
  );
  const assetStatus = useSelector((state: ReceiveScreenRootState) =>
    selectAssetStatus(state, accountUUID, assetId),
  );

  const reads = {
    receive: kindRead(receive, receiveRead),
    accountStatus: kindRead(accountStatus, accountStatusRead),
    assetStatus: isToken ? kindRead(assetStatus, assetStatusRead) : undefined,
  };
  const state = descriptor ? toReceiveScreenState(reads) : ({ type: "error" } as const);

  const isReceiveFailed = reads.receive.failed;
  const isAccountStatusFailed = reads.accountStatus.failed;
  const isAssetStatusFailed = !!reads.assetStatus?.failed;
  const { refresh: refreshReceive } = receiveRead;
  const { refresh: refreshAccountStatus } = accountStatusRead;
  const { refresh: refreshAssetStatus } = assetStatusRead;
  const retry = useCallback(() => {
    if (isReceiveFailed) void refreshReceive();
    if (isAccountStatusFailed) void refreshAccountStatus();
    if (isAssetStatusFailed) void refreshAssetStatus();
  }, [
    isReceiveFailed,
    isAccountStatusFailed,
    isAssetStatusFailed,
    refreshReceive,
    refreshAccountStatus,
    refreshAssetStatus,
  ]);

  const readGateAgain = useCallback(() => {
    void refreshReceive();
    void refreshAccountStatus();
    if (isToken) void refreshAssetStatus();
  }, [isToken, refreshReceive, refreshAccountStatus, refreshAssetStatus]);

  const [followUps, setFollowUps] = useState(0);
  const refreshGate = useCallback(() => {
    readGateAgain();
    setFollowUps(GATE_FOLLOW_UPS);
  }, [readGateAgain]);
  const isGated = state.type === "onboardingRequired" || state.type === "activationRequired";
  useEffect(() => {
    if (!isGated || followUps === 0) return;
    const timer = setTimeout(() => {
      readGateAgain();
      setFollowUps(remaining => remaining - 1);
    }, GATE_FOLLOW_UP_DELAY);
    return () => clearTimeout(timer);
  }, [isGated, followUps, readGateAgain]);

  return {
    descriptor,
    data: state.type === "error" ? { type: "error", retry } : state,
    accountStatus,
    refreshGate,
  };
}
