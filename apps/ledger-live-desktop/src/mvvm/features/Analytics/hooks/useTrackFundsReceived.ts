import { useEffect, useRef } from "react";
import { useSelector } from "LLD/hooks/redux";
import {
  buildReceiveOperationsSnapshot,
  findNewlyReceivedOperations,
  getFundsReceivedTrackingProperties,
} from "@ledgerhq/live-common/analytics/fundsReceived";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";

export function useTrackFundsReceived(): void {
  const accounts = useSelector(accountsSelector);
  const isTrackingEnabled = useSelector(trackingEnabledSelector);
  const previousSnapshotRef = useRef<Map<string, Set<string>> | null>(null);

  useEffect(() => {
    const previousSnapshot = previousSnapshotRef.current;
    const newlyReceivedOperations = findNewlyReceivedOperations(accounts, previousSnapshot);

    for (const { account } of newlyReceivedOperations) {
      const { asset, network } = getFundsReceivedTrackingProperties(account);
      track("Funds received", { asset, network }, isTrackingEnabled);
    }

    previousSnapshotRef.current = buildReceiveOperationsSnapshot(accounts);
  }, [accounts, isTrackingEnabled]);
}
