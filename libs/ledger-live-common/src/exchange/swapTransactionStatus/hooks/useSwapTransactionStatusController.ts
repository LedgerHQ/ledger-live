import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { flattenAccounts } from "../../../account/index";
import { useBridgeSync } from "../../../bridge/react/index";
import {
  createInitialSwapTransactionStatusState,
  getSwapTransactionLegStatusesFromAccounts,
  shouldPollSwapTransactionStatus,
  swapTransactionStatusReducer,
  type SwapTransactionLegStatuses,
  type SwapTransactionStatusControllerState,
} from "../status/statusController";
import type { SwapTransactionStatusParams } from "../types";
import {
  getTransactionStatus,
  type GetTransactionStatusResponse,
} from "../../../wallet-api/Exchange/transactionStatus/index";
import type { AccountLike } from "@ledgerhq/types-live";

const SOFT_DEADLINE_MS = 5_000;
const ACCOUNT_SYNC_INTERVAL_MS = 10_000;
const STATUS_POLL_INTERVAL_MS = 60_000;
// While the swap operation is not yet resolved from local history (e.g. right
// after opening the status UI for a just-broadcast swap), the status section is
// stuck on skeletons. Retry quickly so it fills in within seconds of the
// operation being synced, instead of waiting a full STATUS_POLL_INTERVAL_MS.
const UNRESOLVED_STATUS_POLL_INTERVAL_MS = 3_000;
const UNRESOLVED_ACCOUNT_SYNC_INTERVAL_MS = 10_000;
const STATUS_QUERY_KEY = "swap-transaction-status";

export type SwapTransactionStatusControllerViewModel = {
  phase: SwapTransactionStatusControllerState["phase"];
  latestStatus: SwapTransactionStatusControllerState["latestStatus"];
  details?: GetTransactionStatusResponse;
  isInitialLoading: boolean;
  isSettled: boolean;
};

export function useSwapTransactionStatusController({
  params,
  accounts,
  onAutoRedirect,
}: {
  params: SwapTransactionStatusParams;
  accounts: AccountLike[];
  onAutoRedirect?: (redirectUrl: string) => void;
}): SwapTransactionStatusControllerViewModel {
  const flattenedAccounts = useMemo(() => flattenAccounts(accounts), [accounts]);
  const flattenedAccountsRef = useRef(flattenedAccounts);
  const [details, setDetails] = useState<GetTransactionStatusResponse | undefined>();
  const [state, dispatch] = useReducer(
    swapTransactionStatusReducer,
    undefined,
    createInitialSwapTransactionStatusState,
  );
  const latestStatusRef = useRef(state.latestStatus?.status);

  useEffect(() => {
    flattenedAccountsRef.current = flattenedAccounts;
  }, [flattenedAccounts]);

  useEffect(() => {
    latestStatusRef.current = state.latestStatus?.status;
  }, [state.latestStatus?.status]);

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const loadTransactionStatus = async (): Promise<GetTransactionStatusResponse | undefined> => {
      try {
        const response = await getTransactionStatus(
          {
            swapId: params.swapId,
            provider: params.provider,
          },
          { accounts: flattenedAccountsRef.current },
        );
        if (cancelled) return undefined;
        setDetails(response);
        if (response.provider && response.status) {
          latestStatusRef.current = response.status;
          dispatch({
            type: "POLL_SUCCEEDED",
            status: {
              provider: response.provider,
              swapId: response.swapId,
              status: response.status,
              finalAmount: response.finalAmount,
            },
          });
        }
        return response;
      } catch {
        // Local swap history can be unavailable while accounts are still loading.
        return undefined;
      }
    };

    const scheduleNextPoll = (response: GetTransactionStatusResponse | undefined) => {
      if (cancelled) return;
      const delay = getNextStatusPollDelay(response);
      if (delay !== null) {
        timeout = setTimeout(pollTransactionStatus, delay);
      }
    };

    const pollTransactionStatus = async () => {
      if (
        latestStatusRef.current !== undefined &&
        !shouldPollSwapTransactionStatus(latestStatusRef.current)
      ) {
        return;
      }
      const response = await loadTransactionStatus();
      scheduleNextPoll(response);
    };

    pollTransactionStatus();
    return () => {
      cancelled = true;
      if (timeout !== undefined) clearTimeout(timeout);
    };
  }, [params.provider, params.swapId]);

  useOnChainConfirmationSignal({
    accounts,
    fromAccountId: details?.fromAccountId,
    operationHash: details?.operationHash,
    providerStatus: details?.status,
    enabled: state.phase !== "settled_visible",
    onLegStatusesChanged: legStatuses => {
      setDetails(current => (current ? { ...current, ...legStatuses } : current));
    },
  });

  useUnresolvedSwapOperationSync({
    accounts,
    swapId: params.swapId,
    isResolved: isSwapOperationResolved(details),
    enabled: state.phase !== "settled_visible",
  });

  useEffect(() => {
    const handle = setTimeout(
      () => {
        dispatch({ type: "SOFT_DEADLINE_REACHED" });
      },
      params.redirectUrl ? SOFT_DEADLINE_MS : 0,
    );
    return () => clearTimeout(handle);
  }, [params.redirectUrl]);

  const autoRedirectFiredRef = useRef(false);
  useEffect(() => {
    if (!params.redirectUrl || !state.shouldAutoRedirect || autoRedirectFiredRef.current) return;
    autoRedirectFiredRef.current = true;
    onAutoRedirect?.(params.redirectUrl);
  }, [onAutoRedirect, params.redirectUrl, state.shouldAutoRedirect]);

  return {
    phase: state.phase,
    latestStatus: state.latestStatus,
    details,
    isInitialLoading: state.phase === "polling_hidden" && !state.latestStatus,
    isSettled: state.phase === "settled_visible",
  };
}

function shouldRetryTransactionStatus(response: GetTransactionStatusResponse | undefined): boolean {
  return (
    !response ||
    response.providerRequired === true ||
    !response.status ||
    shouldPollSwapTransactionStatus(response.status)
  );
}

/**
 * A swap is considered resolved once its operation has been found in local
 * history, which is what surfaces the send/receive accounts and unblocks the
 * status section from its skeleton state.
 */
function isSwapOperationResolved(response: GetTransactionStatusResponse | undefined): boolean {
  return Boolean(response?.status && response.fromAccountId && response.toAccountId);
}

/**
 * How long to wait before the next status poll, or `null` to stop polling.
 * Unresolved swaps are retried on a short interval so the UI stops showing
 * skeletons quickly; resolved (still pending) swaps fall back to the slower
 * steady-state interval.
 */
function getNextStatusPollDelay(response: GetTransactionStatusResponse | undefined): number | null {
  if (!shouldRetryTransactionStatus(response)) return null;
  return isSwapOperationResolved(response)
    ? STATUS_POLL_INTERVAL_MS
    : UNRESOLVED_STATUS_POLL_INTERVAL_MS;
}

/**
 * Asks the bridge to sync the account holding this swap until its on-chain operation
 * shows up in local history.
 *
 * `getCompleteSwapHistory` drops any swap whose operation is not yet in `operations` /
 * `pendingOperations`, which leaves the status UI on skeletons (and the swap missing
 * from the history list) until some unrelated sync happens to run. The confirmation
 * signal below cannot cover this: it is keyed on `operationHash`, which is only known
 * once the operation has already been found.
 *
 * Only the account that already holds the swap in `swapHistory` is synced — without
 * such an entry syncing cannot resolve the swap anyway, since the history mapper only
 * walks `swapHistory`, so we stay idle rather than sync accounts for nothing.
 */
function useUnresolvedSwapOperationSync({
  accounts,
  swapId,
  isResolved,
  enabled,
}: {
  accounts: AccountLike[];
  swapId: string;
  isResolved: boolean;
  enabled: boolean;
}): void {
  const sync = useBridgeSync();
  const flattenedAccounts = useMemo(() => flattenAccounts(accounts), [accounts]);
  const syncAccountId = useMemo(
    () =>
      resolveSyncAccountId(flattenedAccounts, findSwapHistoryAccountId(flattenedAccounts, swapId)),
    [flattenedAccounts, swapId],
  );

  useEffect(() => {
    if (!enabled || isResolved || !syncAccountId) return;

    const requestSync = () =>
      sync({
        type: "SYNC_SOME_ACCOUNTS",
        accountIds: [syncAccountId],
        priority: 100,
        reason: STATUS_QUERY_KEY,
      });

    // Sync straight away so a just-broadcast swap resolves in one round trip instead of
    // waiting out the first interval, then keep retrying until it resolves.
    requestSync();
    const handle = setInterval(requestSync, UNRESOLVED_ACCOUNT_SYNC_INTERVAL_MS);
    return () => clearInterval(handle);
  }, [enabled, isResolved, sync, syncAccountId]);
}

/** Id of the account whose `swapHistory` holds `swapId`, if any. */
function findSwapHistoryAccountId(accounts: AccountLike[], swapId: string): string | undefined {
  return accounts.find(account =>
    account.swapHistory?.some(swapOperation => swapOperation.swapId === swapId),
  )?.id;
}

function useOnChainConfirmationSignal({
  accounts,
  fromAccountId,
  operationHash,
  providerStatus,
  enabled,
  onLegStatusesChanged,
}: {
  accounts: AccountLike[];
  fromAccountId: string | undefined;
  operationHash: string | undefined;
  providerStatus: GetTransactionStatusResponse["status"];
  enabled: boolean;
  onLegStatusesChanged: (status: SwapTransactionLegStatuses) => void;
}): void {
  const sync = useBridgeSync();
  const flattenedAccounts = useMemo(() => flattenAccounts(accounts), [accounts]);
  const syncAccountId = useMemo(
    () => resolveSyncAccountId(flattenedAccounts, fromAccountId),
    [flattenedAccounts, fromAccountId],
  );

  useEffect(() => {
    if (!enabled || !syncAccountId || !operationHash) return;
    const handle = setInterval(() => {
      sync({
        type: "SYNC_SOME_ACCOUNTS",
        accountIds: [syncAccountId],
        priority: 100,
        reason: STATUS_QUERY_KEY,
      });
    }, ACCOUNT_SYNC_INTERVAL_MS);
    return () => clearInterval(handle);
  }, [enabled, operationHash, sync, syncAccountId]);

  const legStatuses = useMemo(
    () =>
      enabled
        ? getSwapTransactionLegStatusesFromAccounts({
            accounts: flattenedAccounts,
            operationHash,
            providerStatus,
          })
        : undefined,
    [enabled, flattenedAccounts, operationHash, providerStatus],
  );

  const firedRef = useRef(false);
  useEffect(() => {
    if (!legStatuses?.sendStatus || legStatuses.sendStatus === "pending" || firedRef.current) {
      return;
    }
    firedRef.current = true;
    onLegStatusesChanged(legStatuses);
  }, [legStatuses, onLegStatusesChanged]);
}

function resolveSyncAccountId(
  accounts: AccountLike[],
  accountId: string | undefined,
): string | undefined {
  if (!accountId) return undefined;
  const account = accounts.find(a => a.id === accountId);
  if (!account) return accountId;
  return account.type === "TokenAccount" ? account.parentId : account.id;
}
