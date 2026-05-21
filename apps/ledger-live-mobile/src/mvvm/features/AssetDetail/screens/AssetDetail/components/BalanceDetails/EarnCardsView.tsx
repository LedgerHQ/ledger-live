import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  Text,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { ChevronRight, Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";

type Props = Readonly<{
  formattedAvailable: string;
  formattedDeposit: string;
  onEarnDepositPress: () => void;
}>;

export function EarnCardsView({ formattedAvailable, formattedDeposit, onEarnDepositPress }: Props) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  return (
    <Box lx={rowStyle}>
      <Box lx={cardWrapperStyle} testID={ASSET_DETAIL_TEST_IDS.availableBalance}>
        <Card type="info">
          <CardHeader>
            <CardLeading>
              <CardContent>
                <Box lx={tooltipLabelStyle}>
                  <CardContentDescription>
                    {t("assetDetail.balanceDetails.availableBalance")}
                  </CardContentDescription>
                  <Tooltip>
                    <TooltipTrigger>
                      <Information size={16} color="muted" />
                    </TooltipTrigger>
                    <TooltipContent
                      title={t("assetDetail.balanceDetails.availableBalance")}
                      content={
                        <Box style={{ paddingBottom: bottom + 24 }}>
                          <Text typography="body1" lx={{ color: "base" }}>
                            {t("assetDetail.balanceDetails.availableBalanceTooltip")}
                          </Text>
                        </Box>
                      }
                    />
                  </Tooltip>
                </Box>
                <CardContentTitle>{formattedAvailable}</CardContentTitle>
              </CardContent>
            </CardLeading>
          </CardHeader>
        </Card>
      </Box>
      <Box lx={cardWrapperStyle}>
        <Card onPress={onEarnDepositPress} testID={ASSET_DETAIL_TEST_IDS.earnDeposit}>
          <CardHeader>
            <CardLeading>
              <CardContent>
                <CardContentDescription>
                  {t("assetDetail.balanceDetails.earnDeposit")}
                </CardContentDescription>
                <CardContentTitle>{formattedDeposit}</CardContentTitle>
              </CardContent>
            </CardLeading>
            <ChevronRight size={16} color="muted" />
          </CardHeader>
        </Card>
      </Box>
    </Box>
  );
}

const rowStyle: LumenViewStyle = {
  flexDirection: "row",
  gap: "s8",
};

const cardWrapperStyle: LumenViewStyle = {
  flex: 1,
};

const tooltipLabelStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s4",
};
