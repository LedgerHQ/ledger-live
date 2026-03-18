import {
  type SyncSourcesState,
  useSyncSources as useSyncSourcesCommon,
} from "@ledgerhq/live-common/bridge/react/index";
import { useWalletSyncUserState } from "LLD/features/WalletSync/components/WalletSyncContext";

export type { SyncSourcesState } from "@ledgerhq/live-common/bridge/react/index";

export function useSyncSources(): SyncSourcesState {
  const walletSyncState = useWalletSyncUserState();
  return useSyncSourcesCommon(walletSyncState);
}
