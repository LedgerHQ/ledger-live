import { useMemo } from "react";
import { useLedgerSyncBackends, useLedgerSyncServiceStatus } from "@features/flow-ledger-sync";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import { selectKeyRingSession } from "@features/platform-key-ring";
import { useSelector } from "LLD/hooks/redux";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useKeyRingClient } from "./useKeyRingClient";

export function useLedgerSyncInfo() {
  const treeId = useSelector(selectKeyRingTreeId);
  const session = useSelector(selectKeyRingSession);
  const keyRing = useKeyRingClient();
  const streamPath = useMemo(
    () => keyRing.openStream(session)?.ref.streamPath ?? null,
    [keyRing, session],
  );
  const walletState = useSelector(walletSelector);

  const statusQuery = useLedgerSyncServiceStatus(useLedgerSyncBackends());

  return {
    statusQuery,
    treeId,
    streamPath,
    walletState,
  };
}
