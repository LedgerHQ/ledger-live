import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import {
  BoxedIcon,
  Flex,
  Icon,
  Icons,
  InfiniteLoader,
  Text,
} from "@ledgerhq/native-ui";
import {
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import {
  SwapSelectorStateType,
  Pair,
} from "@ledgerhq/live-common/lib/exchange/swap/types";
import { useNavigation } from "@react-navigation/native";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/live-common/lib/types";
import { usePickDefaultCurrency } from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import CurrencyIcon from "../../../../components/CurrencyIcon";
import { Selector } from "./Selector";
import { CurrencyValue } from "./CurrencyValue";

interface Props {
  to: SwapSelectorStateType;
  setCurrency: (currency: CryptoCurrency | TokenCurrency) => void;
  provider?: string;
  currencies: (CryptoCurrency | TokenCurrency)[];
  amount?: BigNumber;
}

export function To({
  to: { account, currency },
  setCurrency,
  provider,
  currencies,
  amount,
}: Props) {
  const { t } = useTranslation();
  // TODO
  const navigation = useNavigation<any>();

  usePickDefaultCurrency(currencies, currency, setCurrency);

  const name = useMemo(
    () =>
      (account && getAccountName(account)) ?? t("transfer.swap2.form.loading"),
    [account, t],
  );

  const balance = useMemo(() => currency?.units[0].code ?? "", [currency]);

  const onPress = useCallback(() => {
    navigation.navigate("SwapSelectCurrency", { currencies, provider });
  }, [navigation, currencies, provider]);

  const CIcon = currency ? (
    <CurrencyIcon size={32} currency={currency} />
  ) : (
    <BoxedIcon Icon={<InfiniteLoader size={32} />} borderColor="transparent" />
  );

  return (
    <Flex>
      <Text>{t("transfer.swap2.form.to")}</Text>
      <Flex flexDirection="row" justifyContent={"space-between"}>
        <Selector
          Icon={CIcon}
          title={name}
          subTitle={balance || "-"}
          onPress={onPress}
          disabled={!currency}
        />

        <Flex flex={1} justifyContent="center">
          <CurrencyValue currency={currency} amount={amount} />
        </Flex>
      </Flex>
    </Flex>
  );
}
