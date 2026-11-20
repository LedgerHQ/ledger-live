import React from "react";
import { Modal } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import {
  BottomSheetBackgroundContext,
  type BottomSheetBackgroundContextValue,
  type useBottomSheetBackgroundSurface,
} from "@shared/ui-queued-bottom-sheet";

const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;

export type PendingResultScreenViewProps = Readonly<{
  isVisible: boolean;
  /** Changes with every request and outcome. Undefined until something was shown. */
  contentKey: string | undefined;
  onShow: () => void;
  /** The modal finished leaving the screen (iOS). */
  onHidden: () => void;
  /** The Android back button. Undefined while it mustn't close. */
  onRequestClose: (() => void) | undefined;
  topInset: number;
  bottomInset: number;
  backgroundContextValue: BottomSheetBackgroundContextValue;
  BackgroundComponent: ReturnType<typeof useBottomSheetBackgroundSurface>["BackgroundComponent"];
  animatedIndex: SharedValue<number>;
  animatedPosition: SharedValue<number>;
  testID: string;
  children: React.ReactNode;
}>;

/** The pending result as a full screen, over the app: fades in and out, not a sheet sliding up. */
export function PendingResultScreenView({
  isVisible,
  contentKey,
  onShow,
  onHidden,
  onRequestClose,
  topInset,
  bottomInset,
  backgroundContextValue,
  BackgroundComponent,
  animatedIndex,
  animatedPosition,
  testID,
  children,
}: PendingResultScreenViewProps) {
  return (
    <Modal
      visible={isVisible}
      presentationStyle="fullScreen"
      animationType="fade"
      onShow={onShow}
      onDismiss={onHidden}
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <Box lx={{ flex: 1, backgroundColor: "canvas" }} testID={testID}>
        {BackgroundComponent ? (
          <BackgroundComponent
            style={FILL}
            animatedIndex={animatedIndex}
            animatedPosition={animatedPosition}
          />
        ) : null}
        <BottomSheetBackgroundContext.Provider value={backgroundContextValue}>
          <Box
            lx={{ flex: 1, paddingHorizontal: "s16" }}
            style={{ paddingTop: topInset + 16, paddingBottom: bottomInset + 16 }}
          >
            {contentKey === undefined ? null : (
              <Box key={contentKey} lx={{ flex: 1 }}>
                {children}
              </Box>
            )}
          </Box>
        </BottomSheetBackgroundContext.Provider>
      </Box>
    </Modal>
  );
}
