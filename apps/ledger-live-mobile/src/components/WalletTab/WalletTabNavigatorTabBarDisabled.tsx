import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import React, { memo } from "react";
import WalletTabBackgroundGradient from "./WalletTabBackgroundGradient";

function WalletTabNavigatorTabBarDisabled({
  position,
}: MaterialTopTabBarProps) {
  return <WalletTabBackgroundGradient scrollX={position} />;
}

export default memo(WalletTabNavigatorTabBarDisabled);
