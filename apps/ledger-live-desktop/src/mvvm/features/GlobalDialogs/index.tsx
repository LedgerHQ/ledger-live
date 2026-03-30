import React, { Suspense, lazy } from "react";
import ModularDialogRoot from "LLD/features/ModularDialog/ModularDialogRoot";
import SendFlowRoot from "LLD/features/Send/SendFlowRoot";
import PerpsSignModal from "LLD/features/Perps/screens/PerpsSign/PerpsSignModal";

const ReleaseNotes = lazy(() => import("LLD/features/ReleaseNotes"));
const BuyDevice = lazy(() => import("LLD/features/BuyDevice"));

/** Mounts all root-level dialogs and flows. Add new global dialogs here. */
const GlobalDialogs = () => (
  <>
    <ModularDialogRoot />
    <SendFlowRoot />
    <PerpsSignModal />
    <Suspense fallback={null}>
      <ReleaseNotes />
    </Suspense>
    <Suspense fallback={null}>
      <BuyDevice />
    </Suspense>
  </>
);

export default GlobalDialogs;
