import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import type { SecondaryButtonType } from "./useFooterViewModel";
import { ASSET_DETAIL_TEST_IDS } from "../../../../testIds";

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
    <Box
      testID={ASSET_DETAIL_TEST_IDS.ctas}
      lx={containerStyle}
      style={{ paddingBottom: bottom + 16 }}
    >
      <Box lx={rowStyle}>
        {isBuyAvailable && (
          <Box style={buttonSlotStyle}>
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
          <Box style={buttonSlotStyle}>
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
          <Box style={buttonSlotStyle}>
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
  paddingHorizontal: "s16",
  paddingTop: "s16",
};

const rowStyle: LumenViewStyle = {
  flexDirection: "row",
  gap: "s8",
};

const buttonSlotStyle = { flex: 1 } as const;
