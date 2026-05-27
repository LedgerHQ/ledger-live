import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Button, LinearGradient } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import type { SecondaryButtonType } from "./useFooterViewModel";
import { ASSET_DETAIL_TEST_IDS } from "../../../../testIds";

const FADE_ZONE_HEIGHT = 48;

type Props = Readonly<{
  isBuyAvailable: boolean;
  secondaryButton: SecondaryButtonType;
  onBuyPress: () => void;
  onSwapPress: () => void;
  onReceivePress: () => void;
}>;

export function FooterView({
  isBuyAvailable,
  secondaryButton,
  onBuyPress,
  onSwapPress,
  onReceivePress,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();

  if (!isBuyAvailable && !secondaryButton) return null;

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.ctas} lx={containerStyle}>
      <LinearGradient
        stops={[
          { offset: 0, color: "base", opacity: 0 },
          { offset: 1, color: "base", opacity: 1 },
        ]}
        direction="to-bottom"
        style={fadeZoneStyle}
        pointerEvents="none"
      />
      <Box lx={rowStyle} style={{ paddingBottom: bottom + 16 }}>
        {isBuyAvailable && (
          <Box lx={buttonSlotStyle}>
            <Button
              appearance="gray"
              size="lg"
              isFull
              onPress={onBuyPress}
              testID={ASSET_DETAIL_TEST_IDS.buyButton}
            >
              {t("exchange.buy.tabTitle")}
            </Button>
          </Box>
        )}

        {secondaryButton === "swap" && (
          <Box lx={buttonSlotStyle}>
            <Button
              appearance="base"
              size="lg"
              isFull
              onPress={onSwapPress}
              testID={ASSET_DETAIL_TEST_IDS.swapButton}
            >
              {t("transfer.swap.title")}
            </Button>
          </Box>
        )}

        {secondaryButton === "receive" && (
          <Box lx={buttonSlotStyle}>
            <Button
              appearance="base"
              size="lg"
              isFull
              onPress={onReceivePress}
              testID={ASSET_DETAIL_TEST_IDS.footerReceiveButton}
            >
              {t("transfer.receive.title")}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  position: "absolute",
  bottom: "s0",
  left: "s0",
  right: "s0",
};

const fadeZoneStyle = {
  height: FADE_ZONE_HEIGHT,
};

const rowStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
  paddingTop: "s16",
  flexDirection: "row",
  gap: "s8",
  backgroundColor: "base",
};

const buttonSlotStyle: LumenViewStyle = {
  flex: 1,
};
