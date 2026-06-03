import React from "react";
import { AmountDisplay, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { TransferVertical } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";

type Props = Readonly<{
  discreet: boolean;
  counterValue: number | undefined;
  counterValueFormatter: (value: number) => FormattedValue;
  formattedTotalBalance: string;
  onTransferPress: () => void;
}>;

export function TotalBalanceView({
  discreet,
  counterValue,
  counterValueFormatter,
  formattedTotalBalance,
  onTransferPress,
}: Props) {
  const { t } = useTranslation();

  return (
    <Box lx={headerRowStyle}>
      <Box lx={balanceContainerStyle} testID={ASSET_DETAIL_TEST_IDS.totalBalance}>
        <Text typography="body3" lx={{ color: "muted" }}>
          {t("assetDetail.balanceDetails.totalBalance")}
        </Text>
        {counterValue != null && (
          <AmountDisplay
            value={counterValue}
            formatter={counterValueFormatter}
            hidden={discreet}
            size="sm"
          />
        )}
        <Text typography="body3" lx={{ color: "muted" }}>
          {formattedTotalBalance}
        </Text>
      </Box>
      <Button
        appearance="gray"
        size="sm"
        icon={TransferVertical}
        onPress={onTransferPress}
        testID={ASSET_DETAIL_TEST_IDS.transferButton}
      >
        {t("assetDetail.balanceDetails.transfer")}
      </Button>
    </Box>
  );
}

const headerRowStyle: LumenViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
};

const balanceContainerStyle: LumenViewStyle = {
  gap: "s4",
  flex: 1,
};
