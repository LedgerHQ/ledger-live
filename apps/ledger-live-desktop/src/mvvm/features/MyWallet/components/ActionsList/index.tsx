import React from "react";
import { ActionsListView } from "./ActionsListView";
import { useActionsListViewModel, type ActionsListParams } from "./useActionsListViewModel";

export function ActionsList({ onRecoverClick }: Readonly<ActionsListParams>) {
  const { actions } = useActionsListViewModel({ onRecoverClick });

  return <ActionsListView actions={actions} />;
}
