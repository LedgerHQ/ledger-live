import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import {
  PredictionsOrderResultContent,
  type PredictionsOrderResultContentProps,
} from "../PredictionsOrderResultContent/PredictionsOrderResultContent";

export type PredictionsOrderResultLayoutProps = Readonly<{
  /** The status glow, drawn behind the whole page from the top of the screen. */
  background: React.ReactNode;
  result: PredictionsOrderResultContentProps | null;
}>;

/** The order result page: its glow behind, the result within the safe area. */
export function PredictionsOrderResultLayout({
  background,
  result,
}: PredictionsOrderResultLayoutProps) {
  const { top, bottom } = useSafeAreaInsets();

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvasSheet" }} testID="predictions-order-result">
      {result ? (
        <>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {background}
          </View>
          <View style={{ flex: 1, paddingTop: top, paddingBottom: bottom }}>
            <Box lx={{ flex: 1, paddingHorizontal: "s16", paddingVertical: "s16" }}>
              <PredictionsOrderResultContent {...result} />
            </Box>
          </View>
        </>
      ) : null}
    </Box>
  );
}
