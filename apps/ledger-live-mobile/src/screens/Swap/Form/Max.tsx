import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text, Switch } from "@ledgerhq/native-ui";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { useAnalytics } from "~/analytics";
import { sharedSwapTracking } from "../utils";

export function Max({ swapTx }: { swapTx: SwapTransactionType }) {
  const { t } = useTranslation();
  const { track } = useAnalytics();

  const onToggle = (event: boolean) => {
    track("button_clicked", {
      ...sharedSwapTracking,
      button: "max",
      state: event,
    });
    swapTx.toggleMax();
  };

  return (
    <Flex alignSelf="flex-end" flexDirection="row" alignItems="center">
      <Flex flexDirection="row" alignItems="center" paddingY={4}>
        <Text variant="small" paddingRight={2}>
          {t("transfer.swap2.form.amount.useMax")}
        </Text>

        <Switch
          testID="exchange-send-max-toggle"
          checked={swapTx.swap.isMaxEnabled}
          onChange={onToggle}
        />
      </Flex>
    </Flex>
  );
}
