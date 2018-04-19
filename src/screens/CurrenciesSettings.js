/* @flow */
import React, { Fragment, Component, PureComponent } from "react";
import { connect } from "react-redux";
import { ScrollView, StyleSheet, View } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { getCurrencyByCoinType } from "@ledgerhq/currencies";
import type { Currency } from "@ledgerhq/currencies";
import SettingsRow from "../components/SettingsRow";
import SectionTitle from "../components/SectionTitle";
import CurrencyIcon from "../components/CurrencyIcon";
import LText from "../components/LText";
import type { State } from "../reducers";
import { currenciesSettingsSelector } from "../selectors";
import type {
  CurrenciesSettings,
  CurrencySettings
} from "../reducers/settings";

const mapStateToProps = (state: State) => ({
  currenciesSettings: currenciesSettingsSelector(state)
});

class CurrencySettingsSection extends PureComponent<{
  currency: Currency,
  currencySettings: CurrencySettings,
  navigation: *
}> {
  render() {
    const { currency, currencySettings } = this.props;
    return (
      <Fragment>
        <SectionTitle>
          <View style={styles.currencySection}>
            <CurrencyIcon size={20} currency={currency} />
            <LText semiBold style={styles.currencyName}>
              {currency.name}
            </LText>
          </View>
        </SectionTitle>

        <SettingsRow arrowRight title="Confirmation to spend">
          <LText>{currencySettings.confirmationsToSpend}</LText>
        </SettingsRow>

        <SettingsRow arrowRight title="Number of confirmations">
          <LText>{currencySettings.confirmations}</LText>
        </SettingsRow>

        <SettingsRow arrowRight title="Default Transactions fees">
          <LText>{currencySettings.transactionFees}</LText>
        </SettingsRow>

        <SettingsRow arrowRight title="Blockchain explorer">
          <LText>{currencySettings.blockchainExplorer}</LText>
        </SettingsRow>
      </Fragment>
    );
  }
}

class Settings extends Component<{
  navigation: NavigationScreenProp<*>,
  currenciesSettings: CurrenciesSettings
}> {
  static navigationOptions = { title: "Currencies Settings" };

  render() {
    const { navigation, currenciesSettings } = this.props;
    return (
      <ScrollView>
        {Object.keys(currenciesSettings).map(coinTypeStr => {
          const coinType = parseInt(coinTypeStr, 10);
          const currency = getCurrencyByCoinType(coinType);
          const currencySettings = currenciesSettings[coinType];
          return (
            <CurrencySettingsSection
              key={coinTypeStr}
              currency={currency}
              currencySettings={currencySettings}
              navigation={navigation}
            />
          );
        })}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  currencySection: {
    flexDirection: "row"
  },
  currencyName: {
    fontSize: 14,
    marginLeft: 6
  }
});

export default connect(mapStateToProps)(Settings);
