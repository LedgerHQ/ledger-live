import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text, Switch } from "@ledgerhq/native-ui";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";

export function Max({ swapTx }: { swapTx: SwapTransactionType }) {
  const { t } = useTranslation();

  return (
    <Flex alignSelf="flex-end" flexDirection="row" alignItems="center">
      <Flex flexDirection="row" alignItems="center" paddingY={4}>
        <Text variant="small" paddingRight={2}>
          {t("transfer.swap2.form.amount.useMax")}
        </Text>

        <Switch
          checked={swapTx.swap.isMaxEnabled}
          onChange={swapTx.toggleMax}
        />
      </Flex>
    </Flex>
  );
}
