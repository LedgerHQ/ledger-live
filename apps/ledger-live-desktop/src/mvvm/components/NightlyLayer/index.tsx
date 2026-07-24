import React, { memo } from "react";
import { NightlyLayerView } from "./NightlyLayerView";
import { useNightlyLayerViewModel } from "./useNightlyLayerViewModel";

const NightlyLayer = () => {
  const { isVisible, ...viewProps } = useNightlyLayerViewModel();

  if (!isVisible) {
    return null;
  }

  return <NightlyLayerView {...viewProps} />;
};

export default memo(NightlyLayer);
