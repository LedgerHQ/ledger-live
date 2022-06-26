import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { BoxedIcon, Flex, Text } from "@ledgerhq/native-ui";
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
  // TODO: navigation type
  const navigation = useNavigation<any>();
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
    navigation.navigate("SwapSelectAccount", { target: "from" });
  }, [navigation]);

  const fromUnit = account && getAccountUnit(account);

  if (!currency) {
    return null;
  }

  return (
    <Flex>
      <Text>{t("transfer.swap2.form.from")}</Text>
      <Flex flexDirection="row" justifyContent={"space-between"}>
        <Selector
          Icon={
            <BoxedIcon
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
            unit={fromUnit}
            onChange={setAmount}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
