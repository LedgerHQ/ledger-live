import React from "react";
import { selectRemoteFlagsReady } from "@shared/feature-flags";
import { useSelector } from "~/context/hooks";
import { useWatchWalletSync, WalletSyncUserState } from "../../hooks/useWatchWalletSync";

type WalletSyncStatus = Pick<WalletSyncUserState, "visualPending" | "walletSyncError">;

const DEFAULT_STATUS: WalletSyncStatus = { visualPending: false, walletSyncError: null };

export const WalletSyncContext = React.createContext<WalletSyncUserState>({
  ...DEFAULT_STATUS,
  onUserRefresh: () => {},
});

export const useWalletSyncUserState = () => React.useContext(WalletSyncContext);

/**
 * Holds back Ledger Sync until the feature flags have resolved.
 *
 * `useWatchWalletSync` reaches `useTrustchainSdk`, which builds its SDK once and keeps it for
 * the session. Running it before the flags resolve would pin that SDK to whatever the compiled
 * defaults say, and `WaitForAppReady` releases the tree after a second whether the flags landed
 * or not, so the watcher only mounts once `remoteFlagsReady` is set.
 *
 * `children` deliberately sits outside the conditional, as a sibling of the watcher rather than
 * wrapped by it: swapping the element type *around* `children` when readiness flips would unmount
 * and remount the whole app subtree. Being siblings is safe because the two slots keep a constant
 * arity and are reconciled by index, so the watcher appearing beside `children` mounts without
 * displacing it. The provider test pins that down by counting child mounts across the flip.
 *
 * Only the two status fields are lifted, behind an identity check, and the refresh callback is
 * reached through a ref. Lifting the watched object wholesale would loop forever the moment
 * `useWatchWalletSync` returned a fresh object per render, which is not a guarantee this
 * component should depend on.
 */
export function WalletSyncProvider({ children }: { children: React.ReactNode }) {
  const remoteFlagsReady = useSelector(selectRemoteFlagsReady);
  const [status, setStatus] = React.useState<WalletSyncStatus>(DEFAULT_STATUS);
  const onUserRefreshRef = React.useRef<() => void>(() => {});

  const value = React.useMemo<WalletSyncUserState>(
    () => ({ ...status, onUserRefresh: () => onUserRefreshRef.current() }),
    [status],
  );

  return (
    <WalletSyncContext.Provider value={value}>
      {remoteFlagsReady ? (
        <WalletSyncWatcher onStatus={setStatus} onUserRefreshRef={onUserRefreshRef} />
      ) : null}
      {children}
    </WalletSyncContext.Provider>
  );
}

function WalletSyncWatcher({
  onStatus,
  onUserRefreshRef,
}: {
  onStatus: (update: (previous: WalletSyncStatus) => WalletSyncStatus) => void;
  onUserRefreshRef: React.MutableRefObject<() => void>;
}) {
  const { visualPending, walletSyncError, onUserRefresh } = useWatchWalletSync();

  React.useEffect(() => {
    onUserRefreshRef.current = onUserRefresh;
  });

  React.useEffect(() => {
    onStatus(previous =>
      previous.visualPending === visualPending && previous.walletSyncError === walletSyncError
        ? previous
        : { visualPending, walletSyncError },
    );
  }, [visualPending, walletSyncError, onStatus]);

  return null;
}
