import React, { Suspense, lazy } from "react";
import ModularDialogRoot from "LLD/features/ModularDialog/ModularDialogRoot";
import SendFlowRoot from "LLD/features/Send/SendFlowRoot";

const ReleaseNotes = lazy(() => import("LLD/features/ReleaseNotes"));
const BuyDevice = lazy(() => import("LLD/features/BuyDevice"));
const EarnSimulatorDialog = lazy(() => import("LLD/features/EarnSimulator"));

/** Mounts all root-level dialogs and flows. Add new global dialogs here. */
const GlobalDialogs = () => (
  <>
    <ModularDialogRoot />
    <SendFlowRoot />
    <Suspense fallback={null}>
      <ReleaseNotes />
    </Suspense>
    <Suspense fallback={null}>
      <BuyDevice />
    </Suspense>
    <Suspense fallback={null}>
      <EarnSimulatorDialog />
    </Suspense>
  </>
);

export default GlobalDialogs;
