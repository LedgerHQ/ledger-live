/* @flow */
import React, { PureComponent } from "react";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import type { T } from "../../types/common";
import SettingsRow from "../../components/SettingsRow";

type Props = {
  t: T,
  navigation: NavigationScreenProp<*>,
  currency: CryptoCurrency,
};

class AccountCurrencyRow extends PureComponent<Props> {
  render() {
    const { currency, t } = this.props;
    return (
      <SettingsRow
        title={t("common:account.settings.currency.title")}
        desc={`${currency.name} (${currency.ticker})`}
        key={currency.id}
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

export default translate()(AccountCurrencyRow);
