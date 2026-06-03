import type { BottomSheetBackgroundProps } from "@gorhom/bottom-sheet";
import React from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { StatusGradient } from "LLM/components/StatusGradient";
import type { StatusGradientTone } from "LLM/components/StatusGradient";

type BottomSheetGradientProps = BottomSheetBackgroundProps & {
  tone: StatusGradientTone;
};

export const BottomSheetErrorGradient: React.FC<BottomSheetBackgroundProps> = props => {
  return <BottomSheetGradient {...props} tone="error" />;
};

export const BottomSheetInfoGradient: React.FC<BottomSheetBackgroundProps> = props => {
  return <BottomSheetGradient {...props} tone="info" />;
};

export const BottomSheetSuccessGradient: React.FC<BottomSheetBackgroundProps> = props => {
  return <BottomSheetGradient {...props} tone="success" />;
};

export const bottomSheetGradientByTone: Record<
  StatusGradientTone,
  React.FC<BottomSheetBackgroundProps>
> = {
  error: BottomSheetErrorGradient,
  info: BottomSheetInfoGradient,
  success: BottomSheetSuccessGradient,
};

function BottomSheetGradient({ style, tone }: BottomSheetGradientProps) {
  const styles = useStyleSheet(
    theme => ({
      background: {
        backgroundColor: theme.colors.bg.canvasSheet,
        overflow: "hidden" as const,
      },
      statusGradient: StyleSheet.absoluteFillObject,
    }),
    [],
  );

  return (
    <Animated.View pointerEvents="none" style={[style, styles.background]}>
      <StatusGradient
        tone={tone}
        style={styles.statusGradient}
        testID={`bottom-sheet-status-gradient-${tone}`}
      />
    </Animated.View>
  );
}
