/* @flow */
import React, { PureComponent } from "react";
import type { NavigationScreenProp } from "react-navigation";
import { Trans } from "react-i18next";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import SettingsRow from "../../components/SettingsRow";

type Props = {
  navigation: NavigationScreenProp<*>,
  currency: CryptoCurrency,
};

class AccountCurrencyRow extends PureComponent<Props> {
  render() {
    const { currency } = this.props;
    return (
      <SettingsRow
        title={<Trans i18nKey="account.settings.currency.title" />}
        desc={`${currency.name} (${currency.ticker})`}
        key={currency.id}
        arrowRight
        onPress={() =>
          this.props.navigation.navigate("AccountCurrencySettings", {
            currencyId: currency.id,
            fromAccount: true,
          })
        }
      />
    );
  }
}

export default AccountCurrencyRow;
