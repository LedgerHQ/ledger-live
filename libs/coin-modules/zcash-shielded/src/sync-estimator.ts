/**
 * Shared sync-time estimator for the ZCash engines.
 *
 * Shared by both the in-process `ZCashNative` and the IPC `ZCashNativeIPC`
 * wrappers: the logic is a pure wall-clock extrapolation with no native
 * dependency, so duplicating it in each class was pointless.
 */

import type { SyncEstimatedTime } from "./types";

/**
 * Builds an estimator closed over the current wall-clock time.
 *
 * @param totalBlocks total blocks to process (known up front).
 * @returns a function that, given the number of blocks processed so far,
 *          extrapolates the remaining time. Returns `{ hours: 0, minutes: 0 }`
 *          when `processedBlocks <= 0` because we don't have throughput data
 *          yet.
 */
export function createSyncTimeEstimator(
  totalBlocks: number,
): (processedBlocks: number) => SyncEstimatedTime {
  const start = Date.now();

  return (processedBlocks: number): SyncEstimatedTime => {
    if (processedBlocks <= 0) return { hours: 0, minutes: 0 };
    const elapsedSeconds = (Date.now() - start) / 1000;
    const secondsPerBlock = elapsedSeconds / processedBlocks;
    const remainingBlocks = totalBlocks - processedBlocks;
    const remainingSeconds = secondsPerBlock * remainingBlocks;

    const totalMinutes = Math.floor(remainingSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  };
}
