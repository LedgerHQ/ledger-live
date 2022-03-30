import React, { memo } from "react";
import { StyleSheet } from "react-native";
import { ProgressLoader } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import LText, { getFontStyle } from "./LText";

type Props = {
  progress: number,
  size: number,
};

function FirmwareProgress({ progress, size }: Props) {
  const { colors } = useTheme();
  return (
    <ProgressLoader
      progress={progress}
      radius={size}      
    >
      <LText
        style={[
          styles.progressText,
          { color: colors.primary.c100 },
          getFontStyle({ semiBold: true }),
        ]}
      >
      {progress && `${Math.round(progress * 100)}%`}
      </LText>
    </ProgressLoader>
  );
}

const styles = StyleSheet.create({
  progressText: {
    fontSize: 16,
  },
});

export default memo<Props>(FirmwareProgress);
