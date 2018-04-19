/* @flow */
import React, { Component } from "react";
import { connect } from "react-redux";
import { ScrollView, Linking } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import SettingsRow from "../../components/SettingsRow";
import SectionTitle from "../../components/SectionTitle";
import LText from "../../components/LText";
import AuthSecurityToggle from "./AuthSecurityToggle";
import DeltaColorToggle from "./DeltaColorToggle";
import SignOut from "./SignOut";
import { formatChartTimeRange } from "./ChartTimeRange";
import type { State } from "../../reducers";
import type { SettingsState } from "../../reducers/settings";

const mapStateToProps = (state: State) => ({
  settings: state.settings
});

class Settings extends Component<{
  navigation: NavigationScreenProp<*>,
  settings: SettingsState
}> {
  static navigationOptions = { title: "Settings" };

  render() {
    const { navigation, settings } = this.props;
    return (
      <ScrollView>
        <SectionTitle title="DISPLAY" />

        <SettingsRow
          title="Countervalue currency"
          arrowRight
          onPress={() =>
            // $FlowFixMe https://github.com/react-navigation/react-navigation/pull/3843
            navigation.navigate({
              routeName: "SelectFiatUnit",
              key: "selectfiatunit"
            })
          }
        >
          <LText>{settings.counterValue}</LText>
        </SettingsRow>

        <SettingsRow
          title="Dashboard chart time range"
          arrowRight
          onPress={() =>
            // $FlowFixMe https://github.com/react-navigation/react-navigation/pull/3843
            navigation.navigate({
              routeName: "ChartTimeRange",
              key: "ChartTimeRange"
            })
          }
        >
          <LText>{formatChartTimeRange(settings.chartTimeRange)}</LText>
        </SettingsRow>

        <SettingsRow title="Use red for values going up">
          <DeltaColorToggle />
        </SettingsRow>

        <SectionTitle title="CURRENCIES" />

        <SettingsRow
          title="Currencies Settings"
          arrowRight
          onPress={() =>
            // $FlowFixMe https://github.com/react-navigation/react-navigation/pull/3843
            navigation.navigate({
              routeName: "CurrenciesSettings",
              key: "CurrenciesSettings"
            })
          }
        />

        <SectionTitle title="PROFILE" />

        <SettingsRow
          title="Import Accounts"
          arrowRight
          onPress={() =>
            // $FlowFixMe https://github.com/react-navigation/react-navigation/pull/3843
            navigation.navigate({
              routeName: "ImportAccounts",
              key: "ImportAccounts"
            })
          }
        />

        <SettingsRow title="Auth Security">
          <AuthSecurityToggle />
        </SettingsRow>

        <SectionTitle title="ABOUT" />

        <SettingsRow
          title="FAQ"
          arrowRight
          onPress={() => Linking.openURL("https://support.ledgerwallet.com")}
        />

        <SettingsRow
          title="Contact us"
          arrowRight
          onPress={() => Linking.openURL("https://support.ledgerwallet.com")}
        />

        <SettingsRow
          title="Term & Policy"
          arrowRight
          onPress={() => Linking.openURL("https://support.ledgerwallet.com")}
        />

        <SignOut />
      </ScrollView>
    );
  }
}

export default connect(mapStateToProps)(Settings);
