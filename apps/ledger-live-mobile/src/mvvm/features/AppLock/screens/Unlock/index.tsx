import { UnlockView } from "@features/flow-app-lock";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { Logos } from "@ledgerhq/native-ui";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StyleProvider from "~/StyleProvider";
import useUnlockScreenViewModel from "./useUnlockScreenViewModel";

const MARK_WIDTH = 67;
const MARK_HEIGHT = 56;

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
  const viewModel = useUnlockScreenViewModel();

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      <UnlockView
        {...viewModel}
        logo={
          <Logos.LedgerLiveAltRegular
            color={theme.colors.text.base}
            width={MARK_WIDTH}
            height={MARK_HEIGHT}
          />
        }
        topInset={insets.top}
        bottomInset={insets.bottom}
      />
    </Box>
  );
}
