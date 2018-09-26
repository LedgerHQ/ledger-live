/* @flow */
import React, { PureComponent } from "react";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import SettingsRow from "../../components/SettingsRow";
import CurrencyIcon from "../../components/CurrencyIcon";

type Props = {
  navigation: NavigationScreenProp<*>,
  currency: CryptoCurrency,
};

class AccountCurrencyRow extends PureComponent<Props> {
  render() {
    const { currency } = this.props;
    return (
      <SettingsRow
        title={`${currency.name} (${currency.ticker})`}
        iconLeft={<CurrencyIcon size={20} currency={currency} />}
        key={currency.id}
        desc={null}
        arrowRight
        onPress={() =>
          this.props.navigation.navigate("AccountCurrencySettings", {
            currencyId: currency.id,
          })
        }
      />
    );
  }
}

export default AccountCurrencyRow;
