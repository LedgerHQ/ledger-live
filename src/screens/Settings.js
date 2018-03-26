/* @flow */
import React, { Component } from "react";
import { ScrollView, View, Text, StyleSheet, Alert } from "react-native";
import LText from "../components/LText";
import { withReboot } from "../components/RebootContext";
import SectionEntry from "../components/SectionEntry";
import SectionTitle from "../components/SectionTitle";

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

export default class Settings extends Component<*> {
  static navigationOptions = {
    title: "Settings"
  };
  render() {
    const { navigation } = this.props;
    return (
      <ScrollView style={styles.container}>
        <SectionTitle title="DISPLAY" />
        <SectionEntry>
          <LText>Countervalue</LText>
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
