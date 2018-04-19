/* @flow */
import React, { Component } from "react";
import { connect } from "react-redux";
import { ScrollView } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import type { Currency } from "@ledgerhq/currencies";
import type { State } from "../../reducers";
import { currenciesSelector } from "../../reducers/accounts";
import CurrencySettingsSection from "./Section";

const mapStateToProps = (state: State) => ({
  currencies: currenciesSelector(state)
});

class Settings extends Component<{
  navigation: NavigationScreenProp<*>,
  currencies: Currency[]
}> {
  static navigationOptions = { title: "Currencies Settings" };

  render() {
    const { navigation, currencies } = this.props;
    return (
      <ScrollView>
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

export default connect(mapStateToProps)(Settings);
