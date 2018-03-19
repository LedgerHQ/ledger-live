/* @flow */
import React, { Component } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert
} from "react-native";
import LText from "../components/LText";
import { withReboot } from "../components/RebootContext";

class SectionTitle extends Component<*> {
  render() {
    const { title } = this.props;
    return (
      <View style={styles.sectionTitle}>
        <LText style={styles.sectionTitleText}>{title}</LText>
      </View>
    );
  }
}

class SectionEntry extends Component<*> {
  render() {
    const { onPress, children, center } = this.props;
    return (
      <TouchableOpacity onPress={onPress}>
        <View
          style={[styles.sectionEntry, center && styles.sectionEntryCenter]}
        >
          {children}
        </View>
      </TouchableOpacity>
    );
  }
}

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
        <SectionEntry onPress={() => navigation.navigate("ImportAccounts")}>
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
  sectionTitle: {
    padding: 10
  },
  sectionTitleText: {
    fontSize: 14
  },
  sectionEntry: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "white",
    marginBottom: 1
  },
  sectionEntryLabel: {},
  sectionEntryCenter: {
    justifyContent: "center"
  },
  signOutText: {
    color: "#c00"
  }
});
