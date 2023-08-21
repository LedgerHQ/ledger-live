import React from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import usePerformanceReportsLog, {
  getNavigationVitalsStatusStyle,
} from "./usePerformanceReportsLog";
import FloatingDebugButton from "../FloatingDebugButton";

const FloatingPerformanceButton = ({ onPress }: { onPress: () => void }) => {
  const { colors } = useTheme();
  const { lastCompleteRenderPassReport } = usePerformanceReportsLog();

  const navigationVitalsStatusStyle = getNavigationVitalsStatusStyle(
    lastCompleteRenderPassReport,
    colors,
  );
  return (
    <FloatingDebugButton
      onPress={onPress}
      Icon={
        <Text
          color={navigationVitalsStatusStyle.textColor}
          fontWeight={"semiBold"}
          adjustsFontSizeToFit
        >
          {lastCompleteRenderPassReport?.timeToRenderMillis || "-"} ms
        </Text>
      }
      iconContainerProps={{
        backgroundColor: navigationVitalsStatusStyle.bgColor,
      }}
      boxWidth={48}
    />
  );
};

export default React.memo(FloatingPerformanceButton);
