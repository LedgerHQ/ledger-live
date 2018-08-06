/* @flow */
import React, { Component } from "react";
import { ScrollView } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import SettingsRow from "../../components/SettingsRow";
import SignOut from "./SignOut";
import AuthSecurityToggle from "./AuthSecurityToggle";
import CountervalueSettingsRow from "./CountervalueSettingsRow";

class Settings extends Component<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "Settings",
  };

  render() {
    const { navigation } = this.props;
    return (
      <ScrollView contentContainerStyle={{ paddingVertical: 40 }}>
        <CountervalueSettingsRow navigation={navigation} />

        <SettingsRow title="Auth Security">
          <AuthSecurityToggle />
        </SettingsRow>

        <SignOut />
      </ScrollView>
    );
  }
}

export default Settings;
