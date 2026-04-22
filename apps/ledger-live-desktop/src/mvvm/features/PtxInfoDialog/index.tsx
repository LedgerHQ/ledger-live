import React from "react";
import usePtxInfoDialogViewModel from "./usePtxInfoDialogViewModel";
import PtxInfoDialogView from "./PtxInfoDialogView";

const PtxInfoDialog = () => <PtxInfoDialogView {...usePtxInfoDialogViewModel()} />;

export default PtxInfoDialog;
