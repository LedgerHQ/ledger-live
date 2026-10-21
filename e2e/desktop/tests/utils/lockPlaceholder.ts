import { shouldLockBroadcastAccounts } from "@ledgerhq/live-e2e-shared/exclusiveLock";
import { test } from "tests/fixtures/common";
import type { exclusiveLockFor } from "tests/utils/exclusiveLock";

export type LockPlaceholderOptions = {
  flowTitle: string;
  /** The flow's tags, so the run's device and test filters select the placeholder too. */
  tags: string[];
  lock: ReturnType<typeof exclusiveLockFor>;
  holdMs: number;
};

/**
 * Stands in for a flow that only runs when broadcasting, in a run that locks as if it did
 * (E2E_EXCLUSIVE_LOCK_WITHOUT_BROADCAST): it holds the flow's lock for about as long as the flow
 * takes, then reports itself skipped, so the run puts the same load on the lock as a broadcast run.
 */
export function holdLockLikeBroadcastOnlyFlow(options: LockPlaceholderOptions): void {
  const { flowTitle, tags, lock, holdMs } = options;
  const locksWithoutBroadcasting =
    process.env.DISABLE_TRANSACTION_BROADCAST !== "0" && shouldLockBroadcastAccounts(false);

  test.describe(`${flowTitle} (lock placeholder)`, { lock: lock.names }, () => {
    test.skip(
      !locksWithoutBroadcasting,
      "Stands in for the flow only in a run that locks without broadcasting",
    );
    test.use(lock.fixtures);

    test("Holds the lock as the flow would", { tag: tags }, async () => {
      await new Promise(resolve => setTimeout(resolve, holdMs));
      test.skip(true, `Held the lock for ${holdMs / 1000} s in place of the broadcast-only flow`);
    });
  });
}
