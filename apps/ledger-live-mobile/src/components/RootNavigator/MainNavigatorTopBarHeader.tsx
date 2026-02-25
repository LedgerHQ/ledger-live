import React, { useMemo } from "react";
import { View, Platform } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "LLM/components/TopBar";
import { ProgressiveBlurView } from "@sbaiahmed1/react-native-blur";
import { LinearGradient } from "@ledgerhq/lumen-ui-rnative";
import {
  useNavigationBarHeights,
  TOP_BAR_CONTENT_HEIGHT,
  TOP_BAR_WRAPPER_PADDING_TOP,
} from "LLM/hooks/useNavigationBarHeights";

const GRADIENT_STOPS = [
  { color: "base", offset: 0, opacity: 0.8 },
  { color: "base", offset: 0.75, opacity: 0.4 },
  { color: "base", offset: 1, opacity: 0 },
];

const TOP_BAR_CONTAINER_BASE = {
  paddingHorizontal: 16,
  paddingBottom: 12,
  backgroundColor: "transparent" as const,
  height: TOP_BAR_CONTENT_HEIGHT,
};

export const MainNavigatorTopBarHeader = () => {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { top: headerHeight } = useNavigationBarHeights();

  const topBarContainerStyle = useMemo(
    () => ({ ...TOP_BAR_CONTAINER_BASE, marginTop: insets.top }),
    [insets.top],
  );

  const content = (
    <View style={topBarContainerStyle}>
      <TopBar screenName={route.name} />
    </View>
  );

  const wrapperStyle = {
    height: headerHeight,
    paddingTop: TOP_BAR_WRAPPER_PADDING_TOP,
  };

  if (Platform.OS === "ios") {
    return (
      <ProgressiveBlurView
        blurAmount={12}
        startOffset={0}
        style={wrapperStyle}
        blurType="systemMaterial"
      >
        {content}
      </ProgressiveBlurView>
    );
  }

  return (
    <LinearGradient stops={GRADIENT_STOPS} style={wrapperStyle}>
      {content}
    </LinearGradient>
  );
};
