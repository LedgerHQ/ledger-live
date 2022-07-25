import React, { useEffect, useState } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { Flex, Text, Switch } from "@ledgerhq/native-ui";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";

export function Max({ swapTx }: { swapTx: SwapTransactionType }) {
  const { t } = useTranslation();

  const [max, setMax] = useState<BigNumber>();

  useEffect(() => {
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

        {max ? (
          <Text variant="small">
            <CurrencyUnitValue
              showCode
              unit={swapTx.swap.from!.currency!.units[0]}
              value={max}
            />
          </Text>
        ) : (
          <Text variant="small" color="neutral.c70">
            -
          </Text>
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
