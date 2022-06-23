import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import {
  getAccountName,
  getAccountUnit,
} from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { usePickDefaultAccount } from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import { SwapSelectorStateType } from "@ledgerhq/live-common/lib/exchange/swap/types";
import CurrencyIcon from "../../../../components/CurrencyIcon";
import { flattenAccountsSelector } from "../../../../reducers/accounts";
import { Selector } from "./Selector";
import { AmountInput } from "./AmountInput";

interface Props {
  from: SwapSelectorStateType;
  setAccount: (account: Account | TokenAccount) => void;
  setAmount: (amount: BigNumber) => void;
  isMaxEnabled: boolean;
}

export function From({
  from: { account, currency, amount },
  setAccount,
  setAmount,
  isMaxEnabled,
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const accounts = (useSelector(flattenAccountsSelector) as unknown) as ((
    | Account
    | TokenAccount
  ) & { disabled: boolean })[];

  usePickDefaultAccount(accounts, account, setAccount);

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
    /* navigation.navigate(); */
  }, [navigation]);

  const fromUnit = account && getAccountUnit(account);

  if (!currency) {
    return null;
  }

  return (
    <Flex flex={1}>
      <Text>{t("transfer.swap2.form.from")}</Text>
      <Flex flexDirection="row" justifyContent={"space-between"}>
        <Selector
          Icon={<CurrencyIcon size={32} currency={currency} />}
          title={name}
          subTitle={balance}
          onPress={onPress}
        />

        <Flex flex={1} justifyContent="center">
          {fromUnit ? (
            <AmountInput
              value={amount}
              editable={!isMaxEnabled}
              unit={fromUnit}
              onChange={setAmount}
            />
          ) : (
            <Text>0</Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
