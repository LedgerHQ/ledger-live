/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import type { NavigationScreenProp } from "react-navigation";
import { counterValueCurrencySelector } from "../../reducers/settings";
import SettingsRow from "../../components/SettingsRow";
import LText from "../../components/LText";

const mapStateToProps = createStructuredSelector({
  counterValueCurrency: counterValueCurrencySelector
});

class CountervalueSettingsRow extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  counterValueCurrency: *
}> {
  static navigationOptions = {
    title: "Settings"
  };

  render() {
    const { navigation, counterValueCurrency } = this.props;
    return (
      <SettingsRow
        title="Countervalue currency"
        arrowRight
        onPress={() => navigation.navigate("CountervalueSettings")}
      >
        <LText>{counterValueCurrency.name}</LText>
      </SettingsRow>
    );
  }
}

export default connect(mapStateToProps)(CountervalueSettingsRow);
