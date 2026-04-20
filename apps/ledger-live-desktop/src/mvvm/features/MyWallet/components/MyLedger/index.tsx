import React from "react";
import { MyLedgerView } from "./MyLedgerView";
import { useMyLedgerViewModel } from "./hooks/useMyLedgerViewModel";

export function MyLedger() {
  const { title, description, icon, handleClick } = useMyLedgerViewModel();

  return <MyLedgerView title={title} description={description} icon={icon} onClick={handleClick} />;
}
