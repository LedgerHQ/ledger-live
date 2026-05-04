import React from "react";
import { ActionsListView } from "./ActionsListView";
import { useActionsListViewModel } from "./useActionsListViewModel";

export function ActionsList() {
  const { actions } = useActionsListViewModel();

  return <ActionsListView actions={actions} />;
}
