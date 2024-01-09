import React, { useCallback } from "react";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { ScreenName } from "~/const";
import AccountRowLayout from "~/components/AccountRowLayout";
import { track } from "~/analytics";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { AccountsNavigatorParamList } from "~/components/RootNavigator/types/AccountsNavigator";

type Props = {
  currency: CryptoCurrency | TokenCurrency;
  screen: "Wallet" | "Assets";
  navigation: StackNavigatorNavigation<AccountsNavigatorParamList, ScreenName.Accounts>;
};

const ReadOnlyAccountRow = ({ navigation, currency, screen }: Props) => {
  const { name, units, id, type } = currency;

  const onAccountPress = useCallback(() => {
    track("account_clicked", { currency: name, screen });
    navigation.navigate(ScreenName.Account, {
      currencyId: id,
      currencyType: type,
    });
  }, [name, screen, navigation, id, type]);

  return (
    <AccountRowLayout
      onPress={onAccountPress}
      currency={currency}
      currencyUnit={units[0]}
      balance={new BigNumber(0)}
      name={name}
      progress={0}
    />
  );
};

export default React.memo(ReadOnlyAccountRow);
