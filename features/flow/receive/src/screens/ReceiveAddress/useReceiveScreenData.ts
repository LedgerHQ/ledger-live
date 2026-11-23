import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import {
  currencyIdFromNetwork,
  type AccountUUID,
  type NetworkId,
} from "@domain/entity-account-descriptor";
import { selectAccountReceive, type WithAccountReceives } from "@domain/entity-account-receive";
import { accountStatusSlice, type AccountStatusState } from "@domain/entity-account-status";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import { useAccountData, type UseAccountDataResult } from "@features/platform-account-data";
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
  /** Absent until the accounts slice holds the account. */
  network: NetworkId | undefined;
  data: ReceiveScreenData;
}>;

const { selectAccountNetwork } = accountsSlice.getSelectors(
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
  const network = useSelector((state: ReceiveScreenRootState) =>
    selectAccountNetwork(state, accountUUID),
  );
  const isToken = !!network && assetId !== currencyIdFromNetwork(network);
  const assetQuery = useMemo(() => ({ assetId }), [assetId]);

  const receiveRead = useAccountData("receive", accountUUID);
  const accountStatusRead = useAccountData("accountStatus", accountUUID);
  const assetStatusRead = useAccountData("assetStatus", isToken ? accountUUID : undefined, {
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
  const state = network ? toReceiveScreenState(reads) : ({ type: "error" } as const);

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

  return { network, data: state.type === "error" ? { type: "error", retry } : state };
}
