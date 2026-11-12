import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import type { AccountDataError } from "@domain/entity-account-data";
import {
  currencyIdFromNetwork,
  type AccountDescriptor,
  type AccountUUID,
} from "@domain/entity-account-descriptor";
import {
  selectAccountReceive,
  type AccountReceive,
  type WithAccountReceives,
} from "@domain/entity-account-receive";
import {
  receiveGate,
  selectAccountStatus,
  selectAssetStatus,
  type WithAccountStatus,
} from "@domain/entity-account-status";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import { useAccountData } from "@features/platform-account-data";
import type { ReceiveGate } from "../types";

export type UseAccountReceiveResult = Readonly<{
  accountUUID: AccountUUID | undefined;
  /** Absent until the first read answers. */
  receive: AccountReceive | undefined;
  /** What stops the account receiving the asset, `null` when nothing does; absent until known. */
  gate: ReceiveGate | null | undefined;
  /** A read is in flight. */
  pending: boolean;
  /** Of a read whose data the screen still lacks. */
  error: AccountDataError | undefined;
  /** Reads everything again, whatever the freshness. */
  refresh: () => Promise<void>;
  /** Reads the asset's status again, as once its activation flow is over. */
  refreshAssetStatus: () => Promise<void>;
  isAssetStatusPending: boolean;
}>;

/**
 * Keeps what the receive screen needs of one account read while mounted: its `receive` address,
 * its `accountStatus` and the `assetStatus` of the asset received, the native coin when absent.
 */
export function useAccountReceive(
  descriptor: AccountDescriptor | undefined,
  assetId?: CryptoOrTokenCurrencyId,
): UseAccountReceiveResult {
  const receivedId =
    assetId ?? (descriptor ? currencyIdFromNetwork(descriptor.network) : undefined);
  const assetQuery = useMemo(
    () => (receivedId ? { assetId: receivedId } : undefined),
    [receivedId],
  );

  const receiveRead = useAccountData("receive", descriptor);
  const accountStatusRead = useAccountData("accountStatus", descriptor);
  const assetStatusRead = useAccountData("assetStatus", descriptor, { query: assetQuery });
  const { accountUUID } = receiveRead;

  const receive = useSelector((state: WithAccountReceives) =>
    accountUUID ? selectAccountReceive(state, accountUUID) : undefined,
  );
  const accountStatus = useSelector((state: WithAccountStatus) =>
    accountUUID ? selectAccountStatus(state, accountUUID) : undefined,
  );
  const assetStatus = useSelector((state: WithAccountStatus) =>
    accountUUID && receivedId ? selectAssetStatus(state, accountUUID, receivedId) : undefined,
  );

  const isOnboarding = accountStatus?.accountGate?.type === "onboarding";
  const isGateKnown = !!accountStatus && (isOnboarding || !!assetStatus);
  const gate = isGateKnown && accountStatus ? receiveGate(accountStatus, assetStatus) : undefined;

  // An account to onboard has no address yet: its failed `receive` read is expected.
  const error = isOnboarding
    ? undefined
    : ((accountStatus ? undefined : accountStatusRead.error) ??
      (assetStatus ? undefined : assetStatusRead.error) ??
      (receive ? undefined : receiveRead.error));

  const refreshReceive = receiveRead.refresh;
  const refreshAccountStatus = accountStatusRead.refresh;
  const refreshAssetStatus = assetStatusRead.refresh;
  const refresh = useCallback(async () => {
    await Promise.all([refreshReceive(), refreshAccountStatus(), refreshAssetStatus()]);
  }, [refreshReceive, refreshAccountStatus, refreshAssetStatus]);

  return {
    accountUUID,
    receive,
    gate,
    pending: receiveRead.pending || accountStatusRead.pending || assetStatusRead.pending,
    error,
    refresh,
    refreshAssetStatus,
    isAssetStatusPending: assetStatusRead.pending,
  };
}
