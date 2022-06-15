import React, { useCallback } from "react";
import { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { NavigatorName, ScreenName } from "../../../const";
import AccountRowLayout from "../../../components/AccountRowLayout";
import { BigNumber } from "bignumber.js";

type Props = {
  currency: CryptoCurrency;
  navigation: any;
};

const ReadOnlyAccountRow = ({ navigation, currency }: Props) => {
  const { name, units, id, type } = currency;

  const onAccountPress = useCallback(() => {
    navigation.navigate(NavigatorName.Portfolio, {
      screen: NavigatorName.PortfolioAccounts,
      params: {
        screen: ScreenName.Account,
        params: {
          currencyId: id,
          currencyType: type,
        },
      },
    });
  }, [navigation, id, type]);

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

export default React.memo<Props>(ReadOnlyAccountRow);
