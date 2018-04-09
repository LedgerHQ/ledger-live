/* @flow */
import React, { Component } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  Switch
} from "react-native";
import { connect } from "react-redux";
import LText from "../../components/LText";
import { withReboot } from "../../components/RebootContext";
import SectionEntry from "../../components/SectionEntry";
import SectionTitle from "../../components/SectionTitle";
import { saveSettings } from "../../actions/settings";
import type { State } from "../../reducers";

const mapStateToProps = (state: State) => ({
  settings: state.settings
});

const mapDispatchToProps = {
  saveSettings
};

class SignOut_ extends Component<{ reboot: (?boolean) => * }> {
  onResetAll = async () => {
    await this.props.reboot(true);
  };
  onSignOut = () => {
    Alert.alert(
      "Are you sure you want to sign out?",
      "All accounts data will be removed from your phone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign me out", onPress: this.onResetAll }
      ]
    );
  };
  render() {
    return (
      <View style={{ marginVertical: 40 }}>
        <SectionEntry onPress={this.onSignOut} center>
          <Text style={styles.signOutText}>Sign Out</Text>
        </SectionEntry>
      </View>
    );
  }
}

const SignOut = withReboot(SignOut_);

class Settings extends Component<*> {
  static navigationOptions = {
    title: "Settings"
  };

  setEasternColorLocale = (isEastern: boolean) => {
    const { saveSettings } = this.props;

    if (isEastern) {
      saveSettings({ deltaChangeColorLocale: "eastern" });
    } else {
      saveSettings({ deltaChangeColorLocale: "western" });
    }
  };

  render() {
    const { navigation, settings } = this.props;
    return (
      <ScrollView style={styles.container}>
        <SectionTitle title="DISPLAY" />
        <SectionEntry
          onPress={() =>
            navigation.navigate({
              routeName: "SelectFiatUnit",
              key: "selectfiatunit"
            })
          }
        >
          <LText>Countervalue currency ({settings.counterValue})</LText>
        </SectionEntry>
        <SectionEntry>
          <LText>Use red for values going up</LText>
          <Switch
            value={settings.deltaChangeColorLocale === "eastern"}
            onValueChange={this.setEasternColorLocale}
          />
        </SectionEntry>
        <SectionTitle title="TOOLS" />
        <SectionEntry
          onPress={() =>
            navigation.navigate({
              routeName: "ImportAccounts",
              key: "sendfunds"
            })
          }
        >
          <LText>Import Accounts</LText>
        </SectionEntry>
        <SignOut />
      </ScrollView>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Settings);

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  headerText: {
    color: "white",
    fontSize: 16
  },
  signOutText: {
    color: "#c00"
  }
});
