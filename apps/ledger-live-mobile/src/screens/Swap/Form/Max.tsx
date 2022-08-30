import React, { useEffect, useState } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { Flex, Text, Switch, InfiniteLoader } from "@ledgerhq/native-ui";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";

export function Max({
  swapTx,
  isSendMaxLoading,
}: {
  swapTx: SwapTransactionType;
  isSendMaxLoading: boolean;
}) {
  const { t } = useTranslation();

  const [max, setMax] = useState<BigNumber>();

  useEffect(() => {
    setMax(undefined);
    if (!swapTx.swap.from.account) {
      return;
    }

    getAccountBridge(swapTx.swap.from.account, swapTx.swap.from.parentAccount)
      .estimateMaxSpendable({
        account: swapTx.swap.from.account,
        parentAccount: swapTx.swap.from.parentAccount,
      })
      .then(estimate => {
        setMax(estimate);
      });
  }, [swapTx.swap.from]);

  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
    >
      <Flex>
        <Text variant="small">{t("transfer.swap2.form.amount.available")}</Text>

        {swapTx.swap.from.currency && max && !isSendMaxLoading ? (
          <Text variant="small" paddingY={2}>
            <CurrencyUnitValue
              showCode
              unit={swapTx.swap.from.currency.units[0]}
              value={max}
            />
          </Text>
        ) : (
          <Flex paddingY={2} justifyContent="flex-start">
            <InfiniteLoader size={12} />
          </Flex>
        )}
      </Flex>

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
