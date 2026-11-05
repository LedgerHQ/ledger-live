import {
  type SyncSourcesState,
  useSyncSources as useSyncSourcesCommon,
} from "@ledgerhq/live-common/bridge/react/index";
import { useWalletSyncUserState } from "@features/platform-wallet-sync";

export type { SyncSourcesState } from "@ledgerhq/live-common/bridge/react/index";

export function useSyncSources(): SyncSourcesState {
  const walletSyncState = useWalletSyncUserState();
  return useSyncSourcesCommon(walletSyncState);
}
