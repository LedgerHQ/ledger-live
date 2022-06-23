import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Account, TokenAccount } from "@ledgerhq/live-common/lib/types";
import { getAccountName } from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { usePickDefaultAccount } from "@ledgerhq/live-common/lib/exchange/swap/hooks";
import { SwapSelectorStateType } from "@ledgerhq/live-common/lib/exchange/swap/types";
import CurrencyIcon from "../../../../components/CurrencyIcon";
import { flattenAccountsSelector } from "../../../../reducers/accounts";
import { Selector } from "./Selector";

interface Props {
  from: SwapSelectorStateType;
  setAccount: (account: Account | TokenAccount) => void;
}

export function From({ from: { account, currency }, setAccount }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const accounts = useSelector(flattenAccountsSelector);

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

  if (!currency) {
    return null;
  }

  return (
    <Flex>
      <Text>{t("transfer.swap2.form.from")}</Text>
      <Selector
        Icon={<CurrencyIcon size={32} currency={currency} />}
        title={name}
        subTitle={balance}
        onPress={onPress}
      />
    </Flex>
  );
}
