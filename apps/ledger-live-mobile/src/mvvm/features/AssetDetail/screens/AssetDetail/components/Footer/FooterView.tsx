import React from "react";
import { Box, Button, ButtonProps, IconButton } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { BottomGradientFooter } from "LLM/components/BottomGradientFooter";
import type { SecondaryButtonType } from "./useFooterViewModel";
import { ASSET_DETAIL_TEST_IDS } from "../../../../testIds";
import { MoreHorizontal } from "@ledgerhq/lumen-ui-rnative/symbols";
import { MoreOptionsBottomSheet } from "./components/MoreOptionsBottomSheet";

type Props = Readonly<{
  isBuyAvailable: boolean;
  isSellAvailable: boolean;
  isEarnAvailable: boolean;
  isMoreButtonVisible: boolean;
  secondaryButton: SecondaryButtonType;
  onBuyPress: () => void;
  onSellPress: () => void;
  onEarnPress: () => void;
  onSwapPress: () => void;
  onMorePress: () => void;
  isMoreOptionsRequestingToBeOpened: boolean;
  onMoreOptionsClose: () => void;
}>;

const buttonSize: ButtonProps["size"] = "md";

export function FooterView({
  isBuyAvailable,
  isSellAvailable,
  isEarnAvailable,
  isMoreButtonVisible,
  secondaryButton,
  onBuyPress,
  onSellPress,
  onEarnPress,
  onSwapPress,
  onMorePress,
  isMoreOptionsRequestingToBeOpened,
  onMoreOptionsClose,
}: Props) {
  const { t } = useTranslation();
  if (!isBuyAvailable && !secondaryButton && !isMoreButtonVisible) return null;

  const hasTwoButtons = isBuyAvailable && secondaryButton !== null;

  return (
    <BottomGradientFooter testID={ASSET_DETAIL_TEST_IDS.ctas} contentStyle={rowStyle}>
      {isBuyAvailable && (
        <Box lx={buttonSlotStyle}>
          <Button
            appearance={hasTwoButtons ? "gray" : "base"}
            size={buttonSize}
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
            size={buttonSize}
            isFull
            onPress={onSwapPress}
            testID={ASSET_DETAIL_TEST_IDS.swapButton}
          >
            {t("transfer.swap.title")}
          </Button>
        </Box>
      )}

      {isMoreButtonVisible && (
        <Box lx={moreButtonStyle}>
          <IconButton
            appearance="gray"
            size={buttonSize}
            accessibilityLabel={t("assetDetail.footer.moreOptions.accessibilityLabel")}
            onPress={onMorePress}
            icon={MoreHorizontal}
            testID={ASSET_DETAIL_TEST_IDS.footerMoreButton}
          />
        </Box>
      )}
      <MoreOptionsBottomSheet
        isRequestingToBeOpened={isMoreOptionsRequestingToBeOpened}
        onClose={onMoreOptionsClose}
        isSellAvailable={isSellAvailable}
        isEarnAvailable={isEarnAvailable}
        onSellPress={onSellPress}
        onEarnPress={onEarnPress}
      />
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

const moreButtonStyle: LumenViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  maxWidth: "s48",
};
