import { useEffect, useRef } from "react";
import { useSelector } from "~/context/hooks";
import {
  buildReceiveOperationsSnapshot,
  findNewlyReceivedOperations,
  getFundsReceivedTrackingProperties,
} from "@ledgerhq/live-common/analytics/fundsReceived";
import { accountsSelector } from "~/reducers/accounts";
import { track } from "~/analytics/segment";

export function useTrackFundsReceived(): void {
  const accounts = useSelector(accountsSelector);
  const previousSnapshotRef = useRef<Map<string, Set<string>> | null>(null);

  useEffect(() => {
    const previousSnapshot = previousSnapshotRef.current;
    const newlyReceivedOperations = findNewlyReceivedOperations(accounts, previousSnapshot);

    for (const { account } of newlyReceivedOperations) {
      const { asset, network } = getFundsReceivedTrackingProperties(account);
      track("Funds received", { asset, network });
    }

    previousSnapshotRef.current = buildReceiveOperationsSnapshot(accounts);
  }, [accounts]);
}
