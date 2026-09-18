import { isShowingSplash, UnlockView } from "@features/flow-app-lock";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { Logos } from "@ledgerhq/native-ui";
import React from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StyleProvider from "~/StyleProvider";
import useUnlockScreenViewModel from "./useUnlockScreenViewModel";

// The mark's own viewBox, 38 by 32: sizing it square would letterbox it inside the box it is given.
const MARK_ASPECT_RATIO = 38 / 32;
const DESIGN_MARK_WIDTH = 67;

// The launch artwork is a square fitted to the screen, in which the mark spans 441 of 1920 units.
const SPLASH_MARK_RATIO = 441 / 1920;

export function UnlockScreen(): React.JSX.Element {
  // Forced dark, not the user's theme: the splash is black and this takes over from it.
  return (
    <StyleProvider selectedPalette="dark">
      <UnlockScreenContent />
    </StyleProvider>
  );
}

function UnlockScreenContent(): React.JSX.Element {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const viewModel = useUnlockScreenViewModel();

  const markWidth = isShowingSplash(viewModel)
    ? Math.round(Math.min(width, height) * SPLASH_MARK_RATIO)
    : DESIGN_MARK_WIDTH;

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      <UnlockView
        {...viewModel}
        logo={
          <Logos.LedgerLiveAltRegular
            color={theme.colors.text.base}
            width={markWidth}
            height={Math.round(markWidth / MARK_ASPECT_RATIO)}
          />
        }
        topInset={insets.top}
        bottomInset={insets.bottom}
      />
    </Box>
  );
}
