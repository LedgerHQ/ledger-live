import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "../../../../testIds";

type Props = Readonly<{
  isBuyAvailable: boolean;
  onBuyPress: () => void;
}>;

export function FooterView({ isBuyAvailable, onBuyPress }: Props) {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();

  if (!isBuyAvailable) return null;

  return (
    <Box
      testID={ASSET_DETAIL_TEST_IDS.ctas}
      lx={containerStyle}
      style={{ paddingBottom: bottom + 16 }}
    >
      <Box lx={rowStyle}>
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
