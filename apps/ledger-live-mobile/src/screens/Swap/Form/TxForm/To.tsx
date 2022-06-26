import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BoxedIcon, Flex, Icon, Text } from "@ledgerhq/native-ui";
import { getAccountName } from "@ledgerhq/live-common/lib/account";
import {
  SwapSelectorStateType,
  Pair,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import { useNavigation } from "@react-navigation/native";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import {
  usePickDefaultCurrency,
  useSelectableCurrencies,
} from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import CurrencyIcon from "../../../../components/CurrencyIcon";
import { Selector } from "./Selector";

interface Props {
  from: SwapSelectorStateType;
  to: SwapSelectorStateType;
  setCurrency: (currency: CryptoCurrency | TokenCurrency) => void;
  pairs: Pair[];
}

export function To({
  from,
  to: { account, currency },
  setCurrency,
  pairs,
}: Props) {
  const { t } = useTranslation();
  // TODO
  const navigation = useNavigation<any>();

  const currencyNames = useMemo(() => {
    if (!from.currency) {
      return pairs.map(p => p.to);
    }

    return pairs.reduce<string[]>(
      (acc, p) => (p.from === from.currency?.id ? [...acc, p.to] : acc),
      [],
    );
  }, [pairs, from.currency]);

  const currencies = useSelectableCurrencies({
    allCurrencies: [...new Set(currencyNames)],
  });

  usePickDefaultCurrency(currencies, currency, setCurrency);

  const name = useMemo(() => (account && getAccountName(account)) ?? "", [
    account,
  ]);

  const balance = useMemo(() => currency?.units[0].code ?? "", [currency]);

  const onPress = useCallback(() => {
    navigation.navigate("SwapSelectCurrency");
  }, [navigation]);

  const CIcon = currency ? (
    <CurrencyIcon size={32} currency={currency} />
  ) : (
    <BoxedIcon Icon={<Icon name="" />} variant="circle" badgeColor="tomato" />
  );

  return (
    <Flex>
      <Text>{t("transfer.swap2.form.to")}</Text>
      <Flex flexDirection="row" justifyContent={"space-between"}>
        <Selector
          Icon={CIcon}
          title={name || "Select Currency"}
          subTitle={balance || "-"}
          onPress={onPress}
        />

        {/* <Flex flex={1} justifyContent="center">
          <AmountInput
            value={amount}
            editable={!isMaxEnabled}
            unit={fromUnit}
            onChange={setAmount}
          />
  </Flex> */}
      </Flex>
    </Flex>
  );
}
