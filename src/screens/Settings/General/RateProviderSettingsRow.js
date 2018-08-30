/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import {
  counterValueExchangeSelector,
  intermediaryCurrency,
  counterValueCurrencySelector,
} from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import LText from "../../../components/LText";

const mapStateToProps = createStructuredSelector({
  counterValueExchange: counterValueExchangeSelector,
  counterValueCurrency: counterValueCurrencySelector,
});

class RateProviderSettingsRow extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  counterValueExchange: *,
  counterValueCurrency: *,
  t: T,
}> {
  static navigationOptions = {
    title: "Settings",
  };

  render() {
    const {
      navigation,
      counterValueExchange,
      t,
      counterValueCurrency,
    } = this.props;
    return (
      <SettingsRow
        title={t("common:settings.display.exchange")}
        desc={t("common:settings.display.exchangeDesc")}
        arrowRight
        onPress={() =>
          navigation.navigate("RateProviderSettings", {
            from: intermediaryCurrency.ticker,
            to: counterValueCurrency.ticker,
            selected: counterValueExchange,
          })
        }
      >
        <LText>{counterValueExchange}</LText>
      </SettingsRow>
    );
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(RateProviderSettingsRow);
