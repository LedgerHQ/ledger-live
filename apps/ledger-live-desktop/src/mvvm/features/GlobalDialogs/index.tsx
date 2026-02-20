import React, { Suspense, lazy } from "react";
import ModularDialogRoot from "LLD/features/ModularDialog/ModularDialogRoot";
import SendFlowRoot from "LLD/features/Send/SendFlowRoot";

const ReleaseNotes = lazy(() => import("LLD/features/ReleaseNotes"));

/** Mounts all root-level dialogs and flows. Add new global dialogs here. */
const GlobalDialogs = () => (
  <>
    <ModularDialogRoot />
    <SendFlowRoot />
    <Suspense fallback={null}>
      <ReleaseNotes />
    </Suspense>
  </>
);

export default GlobalDialogs;
