import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { useNavigation } from "@react-navigation/native";
import { BoxedIcon, Flex, Text } from "@ledgerhq/native-ui";
import {
  Account,
  AccountLike,
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types";
import {
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { usePickDefaultAccount } from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import { SwapSelectorStateType } from "@ledgerhq/live-common/lib/exchange/swap/types";
import CurrencyIcon from "../../../../components/CurrencyIcon";
import { Selector } from "./Selector";
import { AmountInput } from "./AmountInput";

interface Props {
  from: SwapSelectorStateType;
  setAccount: (account: AccountLike) => void;
  setAmount: (amount: BigNumber) => void;
  isMaxEnabled: boolean;
  accounts: Account[];
  provider?: string;
  currencies: (CryptoCurrency | TokenCurrency)[];
}

export function From({
  from: { account, currency, amount },
  setAccount,
  setAmount,
  isMaxEnabled,
  accounts: accountsProp,
  provider,
  currencies,
}: Props) {
  const { t } = useTranslation();
  // TODO: navigation type
  const navigation = useNavigation<any>();

  const accounts = usePickDefaultAccount(accountsProp, account, setAccount);
  const currencyIds = useMemo(() => currencies.map(c => c.id), [currencies]);

  const name = useMemo(() => (account && getAccountName(account)) ?? "", [
    account,
  ]);
  const balance = useMemo(
    () =>
      (account &&
        currency &&
        formatCurrencyUnit(currency.units[0], account.balance, {
          showCode: true,
        })) ??
      "",
    [account, currency],
  );

  const onPress = useCallback(() => {
    navigation.navigate("SelectAccount", {
      target: "from",
      accountIds: accounts.map(a => a.id),
      provider,
      currencyIds,
    });
  }, [navigation, accounts, provider, currencyIds]);

  const unit = useMemo(() => account && getAccountUnit(account), [account]);

  if (!currency) {
    return null;
  }

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
          Icon={
            <BoxedIcon
              size={32}
              Icon={<CurrencyIcon size={32} currency={currency} />}
              variant="circle"
              borderColor="transparent"
            />
          }
          title={name}
          subTitle={balance}
          onPress={onPress}
        />

        <Flex flex={1} justifyContent="center">
          <AmountInput
            value={amount}
            editable={!isMaxEnabled}
            unit={unit}
            onChange={setAmount}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
