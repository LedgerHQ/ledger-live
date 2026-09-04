import React from "react";
import { ActionTilesView } from "./ActionTilesView";
import type { ActionTilesProps } from "./types";
import { useActionTilesViewModel } from "./useActionTilesViewModel";

export function ActionTiles(props: ActionTilesProps) {
  return <ActionTilesView {...useActionTilesViewModel(props)} />;
}
