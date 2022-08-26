import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import {
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { usePickDefaultAccount } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { SwapTransactionType } from "@ledgerhq/live-common/exchange/swap/types";
import { useSelector } from "react-redux";
import { Selector } from "./Selector";
import { AmountInput } from "./AmountInput";
import { shallowAccountsSelector } from "../../../../reducers/accounts";
import { SwapFormProps } from "../../types";
import { fromSelector } from "../../../../actions/swap";

interface Props {
  provider?: string;
  swapTx: SwapTransactionType;
  swapError?: Error;
}

export function From({ swapTx, provider, swapError }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<SwapFormProps>();

  const accounts = useSelector(fromSelector)(
    useSelector(shallowAccountsSelector),
  );
  const { currency, name, balance, unit } = useMemo(() => {
    const { currency, account } = swapTx.swap.from;

    return {
      account,
      currency,
      name: account && getAccountName(account),
      balance:
        (account &&
          currency &&
          formatCurrencyUnit(currency.units[0], account.balance, {
            showCode: true,
          })) ??
        "",
      unit: account && getAccountUnit(account),
    };
  }, [swapTx.swap.from]);

  usePickDefaultAccount(
    accounts,
    swapTx.swap.from.account,
    swapTx.setFromAccount,
  );

  const pairs = useSelector(state => state.swap.pairs);

  const onPress = useCallback(() => {
    // @ts-expect-error navigation type is only partially declared
    navigation.navigate("SelectAccount", {
      target: "from",
      provider,
      selectableCurrencyIds: [...new Set(pairs.map(p => p.from))],
      swap: swapTx.swap,
    });
  }, [navigation, provider, pairs, swapTx.swap]);

  return (
    <Flex
      borderBottomWidth={1}
      borderColor="neutral.c70"
      paddingBottom={4}
      marginBottom={4}
    >
      <Text>{t("transfer.swap2.form.from")}</Text>
      <Flex flexDirection="row" justifyContent="space-between">
        <Selector
          currency={currency}
          title={name}
          subTitle={balance}
          onPress={onPress}
        />

        <Flex flex={1} justifyContent="center">
          <AmountInput
            value={swapTx.swap.from.amount}
            editable={!swapTx.swap.isMaxEnabled}
            unit={unit}
            onChange={swapTx.setFromAmount}
            error={swapError}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
