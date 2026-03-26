import React from "react";
import { useSelector } from "LLD/hooks/redux";
import { selectIsEarnSimulatorOpen } from "./earnSimulatorDialog";
import useEarnSimulatorViewModel from "./hooks/useEarnSimulatorViewModel";
import EarnSimulatorDialogView from "./EarnSimulatorDialogView";

const EarnSimulatorDialog = () => {
  const isOpen = useSelector(selectIsEarnSimulatorOpen);
  const vm = useEarnSimulatorViewModel(isOpen);

  if (!isOpen) return null;

  return <EarnSimulatorDialogView {...vm} />;
};

export default EarnSimulatorDialog;
