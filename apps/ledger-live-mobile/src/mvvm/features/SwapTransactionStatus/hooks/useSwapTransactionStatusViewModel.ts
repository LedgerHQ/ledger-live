import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Linking } from "react-native";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import {
  createInitialSwapTransactionStatusState,
  shouldPollSwapTransactionStatus,
  swapTransactionStatusReducer,
  type SwapTransactionStatusControllerState,
  type SwapTransactionStatusParams,
} from "@ledgerhq/live-common/exchange/transactionStatus/index";
import {
  getTransactionStatus,
  type GetTransactionStatusResponse,
} from "@ledgerhq/live-common/wallet-api/Exchange/transactionStatus/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";

const SOFT_DEADLINE_MS = 5_000;
const ACCOUNT_SYNC_INTERVAL_MS = 10_000;
const STATUS_POLL_INTERVAL_MS = 60_000;
const STATUS_QUERY_KEY = "transaction-status";

export type SwapTransactionStatusViewModel = {
  phase: SwapTransactionStatusControllerState["phase"];
  latestStatus: SwapTransactionStatusControllerState["latestStatus"];
  details?: GetTransactionStatusResponse;
  isInitialLoading: boolean;
  isSettled: boolean;
};

export function useSwapTransactionStatusViewModel({
  params,
  onClose,
}: {
  params: SwapTransactionStatusParams;
  onClose: () => void;
}): SwapTransactionStatusViewModel {
  const accounts = useSelector(accountsSelector);
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
      if (!cancelled && shouldPollSwapTransactionStatus(response?.status)) {
        timeout = setTimeout(pollTransactionStatus, STATUS_POLL_INTERVAL_MS);
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
      if (timeout) clearTimeout(timeout);
    };
  }, [params.provider, params.swapId]);

  useOnChainConfirmationSignal({
    fromAccountId: details?.fromAccountId,
    operationHash: details?.operationHash,
    swapId: params.swapId,
    provider: details?.provider ?? params.provider,
    enabled: state.phase !== "settled_visible",
    onConfirmed: status => {
      latestStatusRef.current = status.status;
      dispatch({ type: "POLL_SUCCEEDED", status });
    },
  });

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch({ type: "SOFT_DEADLINE_REACHED" });
    }, params.redirectUrl ? SOFT_DEADLINE_MS : 0);
    return () => clearTimeout(handle);
  }, [params.redirectUrl]);

  const autoRedirectFiredRef = useRef(false);
  useEffect(() => {
    if (!params.redirectUrl || !state.shouldAutoRedirect || autoRedirectFiredRef.current) return;
    autoRedirectFiredRef.current = true;
    Linking.openURL(params.redirectUrl).catch(error => {
      console.warn("SwapTransactionStatus auto-redirect failed:", error);
    });
    onClose();
  }, [onClose, params.redirectUrl, state.shouldAutoRedirect]);

  return {
    phase: state.phase,
    latestStatus: state.latestStatus,
    details,
    isInitialLoading: state.phase === "polling_hidden" && !state.latestStatus,
    isSettled: state.phase === "settled_visible",
  };
}

function useOnChainConfirmationSignal({
  fromAccountId,
  operationHash,
  swapId,
  provider,
  enabled,
  onConfirmed,
}: {
  fromAccountId: string | undefined;
  operationHash: string | undefined;
  swapId: string;
  provider: string | undefined;
  enabled: boolean;
  onConfirmed: (status: { provider: string; swapId: string; status: "finished" }) => void;
}): void {
  const accounts = useSelector(accountsSelector);
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

  const isConfirmed = useMemo(() => {
    if (!enabled || !operationHash) return false;
    return flattenedAccounts.some(account =>
      account.operations?.some(
        operation => operation.hash === operationHash && operation.blockHeight != null,
      ),
    );
  }, [enabled, flattenedAccounts, operationHash]);

  const firedRef = useRef(false);
  useEffect(() => {
    if (!isConfirmed || firedRef.current || !provider) return;
    firedRef.current = true;
    onConfirmed({ provider, swapId, status: "finished" });
  }, [isConfirmed, onConfirmed, provider, swapId]);
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
