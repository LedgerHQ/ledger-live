/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import {
  counterValueExchangeSelector,
  intermediaryCurrency,
  counterValueCurrencySelector,
} from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";
import colors from "../../../colors";

const mapStateToProps = createStructuredSelector({
  counterValueExchange: counterValueExchangeSelector,
  counterValueCurrency: counterValueCurrencySelector,
});

class RateProviderSettingsRow extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  counterValueExchange: *,
  counterValueCurrency: *,
}> {
  render() {
    const {
      navigation,
      counterValueExchange,
      counterValueCurrency,
    } = this.props;
    return (
      <SettingsRow
        event="RateProviderSettingsRow"
        title={<Trans i18nKey="settings.display.exchange" />}
        desc={
          <Trans
            i18nKey="settings.display.exchangeDesc"
            values={{
              ...counterValueCurrency,
              fiat: counterValueCurrency.ticker,
            }}
          />
        }
        arrowRight
        onPress={() =>
          navigation.navigate("RateProviderSettings", {
            from: intermediaryCurrency.ticker,
            to: counterValueCurrency.ticker,
            selected: counterValueExchange,
          })
        }
        alignedTop
      >
        <LText semiBold style={styles.exchangeText}>
          {counterValueExchange}
        </LText>
      </SettingsRow>
    );
  }
}

const styles = StyleSheet.create({
  exchangeText: {
    color: colors.grey,
  },
});

export default connect(mapStateToProps)(RateProviderSettingsRow);
