import React from "react";
import { ContextMenuView } from "./ContextMenuView";
import { useContextMenuViewModel } from "./hooks/useContextMenuViewModel";

export function ContextMenu() {
  const props = useContextMenuViewModel();

  return <ContextMenuView {...props} />;
}
