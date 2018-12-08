/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import { counterValueCurrencySelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";
import colors from "../../../colors";

const mapStateToProps = createStructuredSelector({
  counterValueCurrency: counterValueCurrencySelector,
});

class CountervalueSettingsRow extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  counterValueCurrency: *,
}> {
  render() {
    const { navigation, counterValueCurrency } = this.props;
    return (
      <SettingsRow
        event="CountervalueSettingsRow"
        title={<Trans i18nKey="settings.display.counterValue" />}
        desc={<Trans i18nKey="settings.display.counterValueDesc" />}
        arrowRight
        onPress={() => navigation.navigate("CountervalueSettings")}
        alignedTop
      >
        <LText semiBold style={styles.tickerText}>
          {counterValueCurrency.ticker}
        </LText>
      </SettingsRow>
    );
  }
}

const styles = StyleSheet.create({
  tickerText: {
    color: colors.grey,
  },
});

export default connect(mapStateToProps)(CountervalueSettingsRow);
