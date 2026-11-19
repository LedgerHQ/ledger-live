import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ZonePlaceholder } from "./components/ZonePlaceholder";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

const CONTENT_BOTTOM_SPACING = 16;

export function ReceiveAddressView(_props: ReceiveAddressViewProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }} testID="receive-address">
      <ScrollView
        alwaysBounceVertical={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          gap: 24,
          paddingHorizontal: 16,
          // The scroll runs to the screen edge: the inset keeps the last zone above the home indicator.
          paddingBottom: CONTENT_BOTTOM_SPACING + bottom,
        }}
      >
        <ZonePlaceholder zone="header" />
        <ZonePlaceholder zone="summary" />
        <ZonePlaceholder zone="address" />
        <ZonePlaceholder zone="actions" />
        <ZonePlaceholder zone="notices" />
        <ZonePlaceholder zone="extras" />
      </ScrollView>
    </Box>
  );
}
