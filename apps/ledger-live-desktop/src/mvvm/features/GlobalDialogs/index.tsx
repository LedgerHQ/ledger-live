import React, { Suspense, lazy } from "react";
import ModularDialogRoot from "LLD/features/ModularDialog/ModularDialogRoot";
import SendFlowRoot from "LLD/features/Send/SendFlowRoot";
import ActionConfirmationDialog from "LLD/features/ActionConfirmationDialog";

const PerpsSignRoot = lazy(() => import("LLD/features/Perps/screens/PerpsSign/PerpsSignDialog"));
const PerpsDepositRoot = lazy(
  () => import("LLD/features/Perps/screens/PerpsDeposit/PerpsDepositDialog"),
);
const PerpsReviewRoot = lazy(
  () => import("LLD/features/Perps/screens/PerpsReview/PerpsReviewDialog"),
);
const PerpsDepositSignRoot = lazy(
  () => import("LLD/features/Perps/screens/PerpsDepositSign/PerpsDepositSignDialog"),
);
const PerpsTransactionSignedRoot = lazy(
  () => import("LLD/features/Perps/screens/PerpsTransactionSigned/PerpsTransactionSignedDialog"),
);
const ReleaseNotes = lazy(() => import("LLD/features/ReleaseNotes"));
const BuyDevice = lazy(() => import("LLD/features/BuyDevice"));
const FinishOnboardingDialog = lazy(
  () => import("LLD/features/FinishOnboarding/FinishOnboardingDialog"),
);
const PtxInfoDialog = lazy(() => import("LLD/features/PtxInfoDialog"));
const LiveAppModal = lazy(() => import("LLD/features/LiveAppModal"));
const GenericAwarenessModal = lazy(() => import("LLD/features/GenericAwarenessModal"));
const SwapTransactionStatusDialog = lazy(() => import("LLD/features/SwapTransactionStatusDialog"));
const AccountPublicKeyUnavailableDialog = lazy(
  () => import("LLD/features/AccountPublicKeyUnavailableDialog"),
);

/** Mounts all root-level dialogs and flows. Add new global dialogs here. */
const GlobalDialogs = () => (
  <>
    <ModularDialogRoot />
    <Suspense fallback={null}>
      <SendFlowRoot />
    </Suspense>
    <Suspense fallback={null}>
      <PerpsSignRoot />
    </Suspense>
    <Suspense fallback={null}>
      <PerpsDepositRoot />
    </Suspense>
    <Suspense fallback={null}>
      <PerpsReviewRoot />
    </Suspense>
    <Suspense fallback={null}>
      <PerpsDepositSignRoot />
    </Suspense>
    <Suspense fallback={null}>
      <PerpsTransactionSignedRoot />
    </Suspense>
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
    <Suspense fallback={null}>
      <AccountPublicKeyUnavailableDialog />
    </Suspense>
  </>
);

export default GlobalDialogs;
