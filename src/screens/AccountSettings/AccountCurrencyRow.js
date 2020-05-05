/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { ScreenName } from "../../const";
import SettingsRow from "../../components/SettingsRow";

type Props = {
  navigation: *,
  currency: CryptoCurrency,
};

class AccountCurrencyRow extends PureComponent<Props> {
  render() {
    const { currency } = this.props;
    return (
      <SettingsRow
        event="AccountCurrencyRow"
        title={<Trans i18nKey="account.settings.currency.title" />}
        desc={`${currency.name} (${currency.ticker})`}
        key={currency.id}
        arrowRight
        onPress={() =>
          this.props.navigation.navigate(ScreenName.AccountCurrencySettings, {
            currencyId: currency.id,
            fromAccount: true,
          })
        }
      />
    );
  }
}

export default AccountCurrencyRow;
