import React, { Suspense, lazy } from "react";
import ModularDialogRoot from "LLD/features/ModularDialog/ModularDialogRoot";
import SendFlowRoot from "LLD/features/Send/SendFlowRoot";
import PerpsSignRoot from "LLD/features/Perps/screens/PerpsSign/PerpsSignDialog";
import ActionConfirmationDialog from "LLD/features/ActionConfirmationDialog";

const ReleaseNotes = lazy(() => import("LLD/features/ReleaseNotes"));
const BuyDevice = lazy(() => import("LLD/features/BuyDevice"));
const FinishOnboardingDialog = lazy(
  () => import("LLD/features/FinishOnboarding/FinishOnboardingDialog"),
);
const PtxInfoDialog = lazy(() => import("LLD/features/PtxInfoDialog"));
const LiveAppModal = lazy(() => import("LLD/features/LiveAppModal"));
const GenericAwarenessModal = lazy(() => import("LLD/features/GenericAwarenessModal"));
const SwapTransactionStatusDialog = lazy(() => import("LLD/features/SwapTransactionStatusDialog"));

/** Mounts all root-level dialogs and flows. Add new global dialogs here. */
const GlobalDialogs = () => (
  <>
    <ModularDialogRoot />
    <Suspense fallback={null}>
      <SendFlowRoot />
    </Suspense>
    <PerpsSignRoot />
    <ActionConfirmationDialog />
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
    <Suspense fallback={null}>
      <LiveAppModal />
    </Suspense>
    <Suspense fallback={null}>
      <GenericAwarenessModal />
    </Suspense>
    <Suspense fallback={null}>
      <SwapTransactionStatusDialog />
    </Suspense>
  </>
);

export default GlobalDialogs;
