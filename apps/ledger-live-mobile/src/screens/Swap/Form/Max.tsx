import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text, Switch } from "@ledgerhq/native-ui";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";

export function Max({ swapTx }: { swapTx: SwapTransactionType }) {
  const { t } = useTranslation();
  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      justifyContent="flex-end"
      paddingY={4}
    >
      <Flex paddingRight={2}>
        <Text variant="small">{t("transfer.swap2.form.amount.useMax")}</Text>
      </Flex>
      <Switch checked={swapTx.swap.isMaxEnabled} onChange={swapTx.toggleMax} />
    </Flex>
  );
}
