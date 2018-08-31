/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { ScrollView } from "react-native";
import { createStructuredSelector } from "reselect";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import type { NavigationScreenProp } from "react-navigation";
import CurrencySettingsSection from "./CurrencySettingsSection";
import { currenciesSelector } from "../../../reducers/accounts";

type Props = {
  navigation: NavigationScreenProp<*>,
  currencies: CryptoCurrency[],
};

const mapStateToProps = createStructuredSelector({
  currencies: currenciesSelector,
});

class CurrenciesSettings extends PureComponent<Props, *> {
  static navigationOptions = {
    title: "Currencies",
  };

  render() {
    const { navigation, currencies } = this.props;
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {currencies.map(currency => (
          <CurrencySettingsSection
            key={currency.coinType}
            currency={currency}
            navigation={navigation}
          />
        ))}
      </ScrollView>
    );
  }
}

export default connect(mapStateToProps)(CurrenciesSettings);
