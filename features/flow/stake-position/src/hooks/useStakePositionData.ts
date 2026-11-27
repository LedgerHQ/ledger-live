import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useGetEarnPositionsQuery, useRefreshEarnPositions } from "@domain/api-earn-positions";
import { resolveStakePositionData } from "../logic/stakePositionData";
import { answerStakePositionUnavailable } from "../stakePositionRequestStore";
import {
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
  STALE_REREAD_DELAY_MS,
  clearStakePositionTransaction,
  getStakePositionTransaction,
  isWithinTransactedWindow,
  positionKeyOf,
  showsStakePositionTransaction,
  subscribeToStakePositionTransactions,
  type StakePositionKey,
  type TransactedPosition,
} from "../stakePositionTransactions.internals";
import type { ShownStakePositionRequest, StakePositionData } from "../types";

/** Each open reads positions older than this again, and shows the cached ones meanwhile. */
const REFETCH_OLDER_THAN_S = 30;

const LOADING: StakePositionData = { kind: "loading" };
const UNAVAILABLE: StakePositionData = { kind: "unavailable" };

export type UseStakePositionDataInput = Readonly<{
  request: Pick<ShownStakePositionRequest, "id" | "origin" | "positionId">;
  /** Whether the surface is open: a closed one stops reading. */
  isOpen: boolean;
  /** The Earn network of the account, such as `solana`. */
  network: string;
  /** The wallet address that holds the position. */
  ownerAddress: string;
}>;

/** The user's own transaction the position waits for: recorded within the window, or since. */
function useAwaitedTransaction(
  position: StakePositionKey,
  openedAt: number,
): TransactedPosition | null {
  const key = positionKeyOf(position);
  const readTransaction = () => getStakePositionTransaction(key);
  const transaction = useSyncExternalStore(
    subscribeToStakePositionTransactions,
    readTransaction,
    readTransaction,
  );
  return transaction && isWithinTransactedWindow(transaction, openedAt) ? transaction : null;
}

/** Whether this open has waited its minute for the transaction recorded at `recordedAt`. */
function usePollTimedOut(recordedAt: number | undefined): boolean {
  const [timedOutFor, setTimedOutFor] = useState<number>();

  useEffect(() => {
    if (recordedAt === undefined) return;
    const timer = setTimeout(() => setTimedOutFor(recordedAt), POLL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [recordedAt]);

  return recordedAt !== undefined && timedOutFor === recordedAt;
}

type ReadTimes = Readonly<{
  isFetching: boolean;
  startedTimeStamp?: number;
  fulfilledTimeStamp?: number;
}>;

/** Whether a read started at `since` or later has ended: until then the data may be older. */
function hasReadSince(
  { isFetching, startedTimeStamp = 0, fulfilledTimeStamp = 0 }: ReadTimes,
  since: number,
): boolean {
  return fulfilledTimeStamp >= since || (startedTimeStamp >= since && !isFetching);
}

/**
 * A stale snapshot is read once more, a few seconds later, since the backend refreshes stale rows
 * after it answers. Returns when that read was asked, or undefined until then.
 */
function useStaleFollowUp(isStaleRead: boolean, refetch: () => void): number | undefined {
  const [askedAt, setAskedAt] = useState<number>();
  const isDue = isStaleRead && askedAt === undefined;

  useEffect(() => {
    if (!isDue) return;
    const timer = setTimeout(() => {
      setAskedAt(Date.now());
      refetch();
    }, STALE_REREAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isDue, refetch]);

  return askedAt;
}

/**
 * The position the Earn backend reports for the request. After the user's own transaction on it,
 * it reads with `fresh` and polls until the backend shows the transaction, for at most a minute.
 * A position it cannot show (not found, error) is concluded from a read of this open only: from
 * positions cached earlier, it reads again first. For the Earn live app, such a position closes the
 * request, answered `reason: "unavailable"`, and reads as `unavailable` while the surface animates
 * out.
 */
export function useStakePositionData({
  request,
  isOpen,
  network,
  ownerAddress,
}: UseStakePositionDataInput): StakePositionData {
  const { id, origin, positionId } = request;
  const [openedAt] = useState(Date.now);
  const refreshEarnPositions = useRefreshEarnPositions();
  const transaction = useAwaitedTransaction({ ownerAddress, positionId }, openedAt);
  const isTimedOut = usePollTimedOut(transaction?.at);
  const isWaiting = transaction !== null && !isTimedOut;

  const query = useGetEarnPositionsQuery(
    { network, address: ownerAddress, fresh: transaction !== null },
    {
      refetchOnMountOrArgChange: REFETCH_OLDER_THAN_S,
      pollingInterval: isWaiting && isOpen ? POLL_INTERVAL_MS : 0,
    },
  );
  const { data: positions, isError, isFetching, refetch } = query;

  const showsTransaction =
    transaction !== null &&
    positions !== undefined &&
    showsStakePositionTransaction(transaction.action, positions, positionId);

  useEffect(() => {
    if (!showsTransaction) return;
    clearStakePositionTransaction({ ownerAddress, positionId });
    refreshEarnPositions(ownerAddress);
  }, [ownerAddress, positionId, refreshEarnPositions, showsTransaction]);

  const isPolling = isWaiting && !showsTransaction;
  const hasReadThisOpen = hasReadSince(query, openedAt);
  const isStaleRead = isOpen && !isPolling && positions?.isStale === true && hasReadThisOpen;
  const followUpAt = useStaleFollowUp(isStaleRead, refetch);
  const isAwaitingFollowUp = isStaleRead && followUpAt === undefined;
  const canConclude = hasReadSince(query, followUpAt ?? openedAt) && !isAwaitingFollowUp;

  const resolved = useMemo(
    () => resolveStakePositionData({ positions, isError, positionId, isPolling, retry: refetch }),
    [isError, isPolling, positionId, positions, refetch],
  );
  const isConclusion = resolved.kind === "notFound" || resolved.kind === "error";
  const needsRead = isOpen && isConclusion && !hasReadThisOpen && !isFetching;

  useEffect(() => {
    if (needsRead) refetch();
  }, [needsRead, refetch]);

  const data = isConclusion && !canConclude ? LOADING : resolved;
  const isUnavailableToEarn =
    origin === "earn" && (data.kind === "notFound" || data.kind === "error");

  useEffect(() => {
    if (isUnavailableToEarn) answerStakePositionUnavailable(id);
  }, [id, isUnavailableToEarn]);

  return isUnavailableToEarn ? UNAVAILABLE : data;
}
