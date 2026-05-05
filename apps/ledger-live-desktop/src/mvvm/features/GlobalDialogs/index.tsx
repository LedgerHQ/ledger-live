import React, { Suspense, lazy, useMemo } from "react";
import { useLocation } from "react-router";
import ModularDialogRoot from "LLD/features/ModularDialog/ModularDialogRoot";
import SendFlowRoot from "LLD/features/Send/SendFlowRoot";
import PerpsSignRoot from "LLD/features/Perps/screens/PerpsSign/PerpsSignDialog";
import ActionConfirmationDialog from "LLD/features/ActionConfirmationDialog";
import WalletSyncDrawer from "LLD/features/WalletSync/components/Drawer";
import { AnalyticsPage } from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";
import { useActivationDrawer } from "LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer";

const ReleaseNotes = lazy(() => import("LLD/features/ReleaseNotes"));
const BuyDevice = lazy(() => import("LLD/features/BuyDevice"));
const FinishOnboardingDialog = lazy(() => import("LLD/features/FinishOnboarding/FinishOnboardingDialog"));
const PtxInfoDialog = lazy(() => import("LLD/features/PtxInfoDialog"));

/** Ledger Sync activation analytics context — keep in sync with legacy per-screen drawers. */
function walletSyncAnalyticsPageFromPath(pathname: string): AnalyticsPage {
  if (pathname.startsWith("/settings")) return AnalyticsPage.SettingsGeneral;
  if (pathname.startsWith("/accounts")) return AnalyticsPage.Accounts;
  if (pathname.startsWith("/manager")) return AnalyticsPage.Manager;
  if (pathname.startsWith("/sync-onboarding")) return AnalyticsPage.OnboardingSync;
  if (pathname.startsWith("/onboarding")) return AnalyticsPage.Onboarding;
  if (pathname.startsWith("/post-onboarding")) return AnalyticsPage.PostOnboarding;
  return AnalyticsPage.PostOnboarding;
}

function GlobalWalletSyncDrawer() {
  const { pathname } = useLocation();
  const { closeDrawer } = useActivationDrawer();
  const currentPage = useMemo(
    () => walletSyncAnalyticsPageFromPath(pathname),
    [pathname],
  );
  return <WalletSyncDrawer currentPage={currentPage} onClose={closeDrawer} />;
}

/** Mounts all root-level dialogs and flows. Add new global dialogs here. */
const GlobalDialogs = () => (
  <>
    <ModularDialogRoot />
    <SendFlowRoot />
    <PerpsSignRoot />
    <ActionConfirmationDialog />
    <GlobalWalletSyncDrawer />
    <Suspense fallback={null}>
      <ReleaseNotes />
    </Suspense>
    <Suspense fallback={null}>
      <BuyDevice />
    </Suspense>
    <Suspense fallback={null}>
      <FinishOnboardingDialog />
    </Suspense>
    <Suspense fallback={null}>
      <PtxInfoDialog />
    </Suspense>
  </>
);

export default GlobalDialogs;
