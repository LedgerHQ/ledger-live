import React, { useCallback } from "react";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { ScreenName } from "../../../const";
import AccountRowLayout from "../../../components/AccountRowLayout";
import { track } from "../../../analytics";

type Props = {
  currency: CryptoCurrency;
  navigation: any;
  screen: "Wallet" | "Assets";
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

export default React.memo<Props>(ReadOnlyAccountRow);
