/* @flow */
import React, { PureComponent, Fragment } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { currenciesSelector } from "../../../reducers/accounts";
import SettingsRow from "../../../components/SettingsRow";
import CurrencyIcon from "../../../components/CurrencyIcon";

type Props = {
  navigation: NavigationScreenProp<*>,
  currencies: CryptoCurrency[],
};

const mapStateToProps = createStructuredSelector({
  currencies: currenciesSelector,
});

class CurrenciesList extends PureComponent<Props> {
  static navigationOptions = () => ({
    title: "Currencies",
  });

  render() {
    const { currencies, navigation } = this.props;
    return (
      <Fragment>
        {currencies.map(currency => (
          <SettingsRow
            title={currency.ticker}
            iconLeft={<CurrencyIcon size={20} currency={currency} />}
            key={currency.id}
            desc={null}
            arrowRight
            onPress={() =>
              navigation.navigate("CurrencySettings", {
                currencyId: currency.id,
              })
            }
          />
        ))}
      </Fragment>
    );
  }
}

export default connect(mapStateToProps)(CurrenciesList);
