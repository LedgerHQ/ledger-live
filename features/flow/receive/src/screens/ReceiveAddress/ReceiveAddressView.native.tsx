import React from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { ArrowLeft, Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { ReceiveAddressTitle } from "./components/ReceiveAddressTitle";
import { ZonePlaceholder } from "./components/ZonePlaceholder";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

const CONTENT_BOTTOM_SPACING = 16;

export function ReceiveAddressView({
  title,
  networkLabel,
  networkIcon,
  onBack,
  onClose,
}: ReceiveAddressViewProps) {
  const { t } = useTranslation();
  const { top, bottom } = useSafeAreaInsets();

  return (
    <Box
      lx={{ flex: 1, backgroundColor: "canvas" }}
      style={{ paddingTop: top }}
      testID="receive-address"
    >
      <Box lx={{ alignItems: "flex-start", paddingHorizontal: "s4", paddingTop: "s8" }}>
        <IconButton
          icon={onBack ? ArrowLeft : Close}
          appearance="no-background"
          size="md"
          onPress={onBack ?? onClose}
          accessibilityLabel={onBack ? t("receiveAddress.back") : t("receiveAddress.close")}
          testID="receive-address-close"
        />
      </Box>
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
        <ReceiveAddressTitle title={title} networkLabel={networkLabel} networkIcon={networkIcon} />
        <ZonePlaceholder zone="summary" />
        <ZonePlaceholder zone="address" />
        <ZonePlaceholder zone="actions" />
        <ZonePlaceholder zone="notices" />
        <ZonePlaceholder zone="extras" />
      </ScrollView>
    </Box>
  );
}
