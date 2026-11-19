import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  selectSolanaValidatorApy,
  useGetEarnPositionsQuery,
  useGetSolanaValidatorApyQuery,
  useRefreshEarnPositions,
} from "@domain/api-earn-positions";
import type { ApyFraction } from "@domain/entity-earn-position";
import { findStakePositionRow, resolveStakePositionData } from "../logic/stakePositionData";
import { answerStakePositionUnavailable } from "../stakePositionRequestStore";
import {
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
  clearStakePositionTransaction,
  getStakePositionTransaction,
  isWithinTransactedWindow,
  positionKeyOf,
  showsStakePositionTransaction,
  subscribeToStakePositionTransactions,
  type StakePositionKey,
} from "../stakePositionTransactions.internals";
import type {
  ShownStakePositionRequest,
  StakePositionData,
  StakePositionExitAction,
} from "../types";

/** Each open reads positions older than this again, and shows the cached ones meanwhile. */
const REFETCH_OLDER_THAN_S = 30;

const UNAVAILABLE: StakePositionData = { kind: "unavailable" };

export type UseStakePositionDataInput = Readonly<{
  request: Pick<ShownStakePositionRequest, "id" | "origin" | "positionId">;
  /** Whether the surface is open: a closed one stops polling. */
  isOpen: boolean;
  /** The Earn network of the account, such as `solana`. */
  network: string;
  /** The wallet address that holds the position. */
  ownerAddress: string;
}>;

/** The user's own transaction the position still waits for, as it stood when the surface opened. */
function useAwaitedTransaction(position: StakePositionKey): StakePositionExitAction | null {
  const key = positionKeyOf(position);
  const readTransaction = () => getStakePositionTransaction(key);
  const transaction = useSyncExternalStore(
    subscribeToStakePositionTransactions,
    readTransaction,
    readTransaction,
  );
  const [openedAt] = useState(Date.now);
  return transaction && isWithinTransactedWindow(transaction, openedAt) ? transaction.action : null;
}

function useHasElapsed(isRunning: boolean, delayMs: number): boolean {
  const [hasElapsed, setHasElapsed] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setTimeout(() => setHasElapsed(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, isRunning]);

  return hasElapsed;
}

/**
 * The APY of the validator the current row names, read on every render. It never holds the details
 * back: unknown while it loads, fails or lists no such validator.
 */
function useValidatorApy(validatorAddress: string): ApyFraction | undefined {
  const { validatorApy } = useGetSolanaValidatorApyQuery(undefined, {
    skip: validatorAddress === "",
    selectFromResult: ({ data }) => ({
      validatorApy: selectSolanaValidatorApy(data, validatorAddress),
    }),
  });
  return validatorApy;
}

/**
 * The position the Earn backend reports for the request. After the user's own transaction on it,
 * it reads with `fresh` and polls until the backend shows the transaction, for at most a minute.
 * For the Earn live app, a position that cannot be shown closes the request, answered
 * `reason: "unavailable"`, and reads as `unavailable` while the surface animates out.
 */
export function useStakePositionData({
  request,
  isOpen,
  network,
  ownerAddress,
}: UseStakePositionDataInput): StakePositionData {
  const { id, origin, positionId } = request;
  const refreshEarnPositions = useRefreshEarnPositions();
  const transaction = useAwaitedTransaction({ ownerAddress, positionId });
  const [readsFresh] = useState(transaction !== null);
  const isTimedOut = useHasElapsed(transaction !== null, POLL_TIMEOUT_MS);
  const isWaiting = transaction !== null && !isTimedOut;

  const {
    data: positions,
    isError,
    refetch,
  } = useGetEarnPositionsQuery(
    { network, address: ownerAddress, fresh: readsFresh },
    {
      refetchOnMountOrArgChange: REFETCH_OLDER_THAN_S,
      pollingInterval: isWaiting && isOpen ? POLL_INTERVAL_MS : 0,
    },
  );

  const showsTransaction =
    transaction !== null &&
    positions !== undefined &&
    showsStakePositionTransaction(transaction, positions, positionId);

  useEffect(() => {
    if (!showsTransaction) return;
    clearStakePositionTransaction({ ownerAddress, positionId });
    refreshEarnPositions(ownerAddress);
  }, [ownerAddress, positionId, refreshEarnPositions, showsTransaction]);

  const row = positions && findStakePositionRow(positions, positionId);
  const validatorApy = useValidatorApy(row?.kind === "one" ? row.position.validatorAddress : "");
  const isPolling = isWaiting && !showsTransaction;

  const data = useMemo(
    () =>
      resolveStakePositionData({
        positions,
        isError,
        positionId,
        validatorApy,
        isPolling,
        retry: refetch,
      }),
    [isError, isPolling, positionId, positions, refetch, validatorApy],
  );

  const isUnavailableToEarn =
    origin === "earn" && (data.kind === "notFound" || data.kind === "error");

  useEffect(() => {
    if (isUnavailableToEarn) answerStakePositionUnavailable(id);
  }, [id, isUnavailableToEarn]);

  return isUnavailableToEarn ? UNAVAILABLE : data;
}
