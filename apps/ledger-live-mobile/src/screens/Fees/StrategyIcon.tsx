import { Strategy } from "@ledgerhq/coin-evm/lib/types/index";
import { SpeedFast, SpeedLow, SpeedMedium } from "@ledgerhq/icons-ui/native";
import React, { useMemo } from "react";
import { useTheme } from "styled-components/native";

type Props = {
  strategy: Strategy;
  active: boolean;
};

const SIZE = "M";

export function StrategyIcon({ strategy, active }: Props) {
  const { colors } = useTheme();

  const iconColor = useMemo(
    () => (active ? colors.primary.c80 : colors.opacityDefault.c50),
    [colors, active],
  );

  switch (strategy) {
    case "slow":
      return <SpeedLow size={SIZE} color={iconColor} />;
    case "medium":
      return <SpeedMedium size={SIZE} color={iconColor} />;
    case "fast":
      return <SpeedFast size={SIZE} color={iconColor} />;
    default:
      return <SpeedMedium size={SIZE} color={iconColor} />;
  }
}
