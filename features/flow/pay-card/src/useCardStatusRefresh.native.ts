import { useEffect } from "react";
import { AppState } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useGetCardStatusQuery } from "@domain/api-card-management";
import {
  endDigitalWalletProvisioning,
  selectDigitalWalletProvisioningStartedAt,
} from "@features/flow-pay-card-widget/state";

const PROVISIONING_RETRY_DELAYS_MS: readonly number[] = [3_000, 5_000, 10_000, 15_000];
const PROVISIONING_RETRY_INTERVAL_MS = 30_000;
const PROVISIONING_WATCH_MS = 3 * 60_000;
const FOREGROUND_STALE_MS = 30_000;

type Params = {
  readonly skip: boolean;
};

/**
 * Keeps the card status from going stale while the Pay tab stays mounted.
 *
 * Nothing else re-reads it: the cache entry never expires while subscribed, and RTK Query's focus
 * refetching is not wired in the app. Two things are handled here:
 * - after the holder is back from the phone's wallet, the status is re-read on a backoff until the
 *   provider reports the card there, or the wait runs out;
 * - when the app comes back to the foreground, a status older than `FOREGROUND_STALE_MS` is re-read.
 */
export function useCardStatusRefresh({ skip }: Params): void {
  const dispatch = useDispatch();
  const startedAt = useSelector(selectDigitalWalletProvisioningStartedAt);
  const { data, refetch, fulfilledTimeStamp } = useGetCardStatusQuery(undefined, { skip });
  const isInWallet = data?.cardAddedToDigitalWallet === true;

  useEffect(() => {
    if (startedAt === null) return;

    if (skip || isInWallet) {
      dispatch(endDigitalWalletProvisioning());
      return;
    }

    const deadline = startedAt + PROVISIONING_WATCH_MS;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleNext = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        dispatch(endDigitalWalletProvisioning());
        return;
      }

      const delay = PROVISIONING_RETRY_DELAYS_MS[attempt] ?? PROVISIONING_RETRY_INTERVAL_MS;
      timer = setTimeout(
        () => {
          attempt += 1;
          // Timers can still fire in the background on Android; the return to the foreground
          // re-reads instead.
          if (AppState.currentState === "active") {
            refetch();
          }
          scheduleNext();
        },
        Math.min(delay, remaining),
      );
    };

    refetch();
    scheduleNext();

    return () => clearTimeout(timer);
  }, [dispatch, isInWallet, refetch, skip, startedAt]);

  useEffect(() => {
    if (skip) return;

    const subscription = AppState.addEventListener("change", nextState => {
      if (nextState !== "active") return;

      const isStale =
        fulfilledTimeStamp === undefined || Date.now() - fulfilledTimeStamp >= FOREGROUND_STALE_MS;
      if (startedAt !== null || isStale) {
        refetch();
      }
    });

    return () => subscription.remove();
  }, [fulfilledTimeStamp, refetch, skip, startedAt]);
}
