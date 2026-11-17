import React from "react";
import { HideNightlyLayerRowView } from "./HideNightlyLayerRowView";
import { useHideNightlyLayerRowViewModel } from "./useHideNightlyLayerRowViewModel";

export function HideNightlyLayerRow() {
  const { isAvailable, isHidden, onChange } = useHideNightlyLayerRowViewModel();

  if (!isAvailable) {
    return null;
  }

  return <HideNightlyLayerRowView isHidden={isHidden} onChange={onChange} />;
}
