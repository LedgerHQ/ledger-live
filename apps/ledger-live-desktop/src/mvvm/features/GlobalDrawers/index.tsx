import React, { useMemo } from "react";
import { useLocation } from "react-router";
import WalletSyncDrawer from "LLD/features/WalletSync/components/Drawer";
import { useActivationDrawer } from "LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer";
import { walletSyncAnalyticsPageFromPath } from "../WalletSync/walletSyncAnalyticsPageFromPath";

const GlobalWalletSyncDrawer = () => {
  const { pathname } = useLocation();
  const { closeDrawer } = useActivationDrawer();
  const currentPage = useMemo(() => walletSyncAnalyticsPageFromPath(pathname), [pathname]);

  return <WalletSyncDrawer currentPage={currentPage} onClose={closeDrawer} />;
};

/** Mounts all root-level drawers. Add new global drawers here. */
const GlobalDrawers = () => (
  <>
    <GlobalWalletSyncDrawer />
  </>
);

export default GlobalDrawers;
