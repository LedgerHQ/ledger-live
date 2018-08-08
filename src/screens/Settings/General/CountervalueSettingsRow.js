/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import { counterValueCurrencySelector } from "../../../reducers/settings";
import type { T } from "../../../types/common";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";

const mapStateToProps = createStructuredSelector({
  counterValueCurrency: counterValueCurrencySelector,
});

class CountervalueSettingsRow extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  counterValueCurrency: *,
  t: T,
}> {
  static navigationOptions = {
    title: "Settings",
  };

  render() {
    const { navigation, counterValueCurrency, t } = this.props;
    return (
      <SettingsRow
        title={t("common:settings.display.counterValue")}
        desc={t("common:settings.display.counterValueDesc")}
        arrowRight
        onPress={() => navigation.navigate("CountervalueSettings")}
      >
        <LText>{counterValueCurrency.ticker}</LText>
      </SettingsRow>
    );
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(CountervalueSettingsRow);
