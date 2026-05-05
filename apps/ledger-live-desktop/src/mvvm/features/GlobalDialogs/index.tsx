import React, { Suspense, lazy } from "react";
import ModularDialogRoot from "LLD/features/ModularDialog/ModularDialogRoot";
import SendFlowRoot from "LLD/features/Send/SendFlowRoot";
import PerpsSignRoot from "LLD/features/Perps/screens/PerpsSign/PerpsSignDialog";
import ActionConfirmationDialog from "LLD/features/ActionConfirmationDialog";

const ReleaseNotes = lazy(() => import("LLD/features/ReleaseNotes"));
const BuyDevice = lazy(() => import("LLD/features/BuyDevice"));
const FinishOnboardingDialog = lazy(() => import("LLD/features/FinishOnboarding/FinishOnboardingDialog"));
const PtxInfoDialog = lazy(() => import("LLD/features/PtxInfoDialog"));

/** Mounts all root-level dialogs and flows. Add new global dialogs here. */
const GlobalDialogs = () => (
  <>
    <ModularDialogRoot />
    <SendFlowRoot />
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
  </>
);

export default GlobalDialogs;
