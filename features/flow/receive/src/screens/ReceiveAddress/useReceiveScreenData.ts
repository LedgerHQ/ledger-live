import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { accountsSlice, type AccountsState, type AccountUUID } from "@domain/entity-account";
import { selectAccountReceive, type WithAccountReceives } from "@domain/entity-account-receive";
import {
  accountStatusSlice,
  type AccountStatus,
  type AccountStatusState,
} from "@domain/entity-account-status";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import { useAccountData, type UseAccountDataResult } from "@features/platform-account-data";
import { toReceiveReadFailure, type ReceiveReadFailure } from "../../logic/toReceiveReadFailure";
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
  | (Readonly<{ type: "error"; retry: () => void }> & ReceiveReadFailure);

export type UseReceiveScreenDataResult = Readonly<{
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

/** Reads `assetStatus` for any asset: the native coin answers no gate. */
export function useReceiveScreenData(
  accountUUID: AccountUUID,
  assetId: CryptoOrTokenCurrencyId,
): UseReceiveScreenDataResult {
  const hasAccount = useSelector(
    (state: ReceiveScreenRootState) => selectAccountEntry(state, accountUUID) !== undefined,
  );
  const assetQuery = useMemo(() => ({ assetId }), [assetId]);

  const receiveRead = useAccountData("receive", accountUUID);
  const accountStatusRead = useAccountData("accountStatus", accountUUID);
  const assetStatusRead = useAccountData("assetStatus", accountUUID, {
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
    assetStatus: kindRead(assetStatus, assetStatusRead),
  };
  const state = hasAccount ? toReceiveScreenState(reads) : ({ type: "error" } as const);
  const screenState =
    state.type === "error"
      ? {
          ...state,
          ...toReceiveReadFailure(hasAccount, {
            receive: { failed: reads.receive.failed, error: receiveRead.error },
            accountStatus: { failed: reads.accountStatus.failed, error: accountStatusRead.error },
            assetStatus: { failed: reads.assetStatus.failed, error: assetStatusRead.error },
          }),
        }
      : state;

  const isReceiveFailed = reads.receive.failed;
  const isAccountStatusFailed = reads.accountStatus.failed;
  const isAssetStatusFailed = reads.assetStatus.failed;
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
    void refreshAssetStatus();
  }, [refreshReceive, refreshAccountStatus, refreshAssetStatus]);

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
    data: screenState.type === "error" ? { ...screenState, retry } : screenState,
    accountStatus,
    refreshGate,
  };
}
