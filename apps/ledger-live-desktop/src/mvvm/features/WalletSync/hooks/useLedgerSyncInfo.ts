import { useMemo } from "react";
import { useLedgerSyncServiceStatus } from "@features/flow-ledger-sync";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import { selectKeyRingSession } from "@features/platform-key-ring";
import { useFeature } from "@features/platform-feature-flags";
import getWalletSyncEnvironmentParams from "@ledgerhq/live-common/walletSync/getEnvironmentParams";
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

  const featureWalletSync = useFeature("lldWalletSync");
  const { trustchainApiBaseUrl, cloudSyncApiBaseUrl } = getWalletSyncEnvironmentParams(
    featureWalletSync?.params?.environment,
  );
  const statusQuery = useLedgerSyncServiceStatus({
    keyRingApiBaseUrl: trustchainApiBaseUrl,
    cloudSyncApiBaseUrl,
  });

  return {
    statusQuery,
    treeId,
    streamPath,
    walletState,
  };
}
