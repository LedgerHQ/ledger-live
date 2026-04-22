import React from "react";
import { useQuickActionsRowViewModel } from "./useQuickActionsRowViewModel";
import { QuickActionsRowView } from "./QuickActionsRowView";

export function QuickActionsRow() {
  const { actions } = useQuickActionsRowViewModel();

  return <QuickActionsRowView actions={actions} />;
}
