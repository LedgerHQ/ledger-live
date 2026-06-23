import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { BottomGradientFooter } from "LLM/components/BottomGradientFooter";
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
  const { t } = useTranslation();

  if (!isBuyAvailable && !secondaryButton) return null;

  return (
    <BottomGradientFooter testID={ASSET_DETAIL_TEST_IDS.ctas} contentStyle={rowStyle}>
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
    </BottomGradientFooter>
  );
}

const rowStyle: LumenViewStyle = {
  flexDirection: "row",
  gap: "s8",
};

const buttonSlotStyle: LumenViewStyle = {
  flex: 1,
};
