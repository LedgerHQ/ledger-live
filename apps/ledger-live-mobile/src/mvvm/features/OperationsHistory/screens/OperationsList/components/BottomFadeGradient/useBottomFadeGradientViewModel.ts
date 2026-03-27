import { useMemo } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { rgba } from "@ledgerhq/native-ui/styles/helpers";

export function useBottomFadeGradientViewModel() {
  const { theme } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const bgBase = theme.colors.bg.base;

  const colors = useMemo(
    () => [rgba(bgBase, 0), rgba(bgBase, 0.3), rgba(bgBase, 0.75), rgba(bgBase, 1)],
    [bgBase],
  );

  // On Android, the nav bar is opaque and doesn't need the gradient to extend into it
  // like iOS does for the transparent home indicator area.
  const bottomInset = Platform.OS === "ios" ? bottom : 0;

  return { colors, bottomInset };
}
