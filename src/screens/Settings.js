/* @flow */
import React, { Component } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  StyleSheet
} from "react-native";

class SectionTitle extends Component<*> {
  render() {
    const { title } = this.props;
    return (
      <View style={styles.sectionTitle}>
        <Text style={styles.sectionTitleText}>{title}</Text>
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

class SignOut extends Component<*> {
  onSignOut = () => {};
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

export default class Settings extends Component<*> {
  static navigationOptions = {
    title: "Settings"
  };
  render() {
    const { navigation } = this.props;
    return (
      <ScrollView style={styles.container}>
        <SectionTitle title="PERSONAL INFO" />
        <SectionEntry onPress={() => navigation.navigate("EditPersonalInfo")}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 40,
                height: 40,
                backgroundColor: "black",
                borderRadius: 25,
                marginRight: 10
              }}
            />
            <Text style={{ fontWeight: "bold" }}>Evelyn Fowler</Text>
          </View>
        </SectionEntry>
        <SectionTitle title="DISPLAY" />
        <SectionEntry>
          <Text style={styles.sectionEntryLabel}>Countervalue</Text>
        </SectionEntry>
        <SectionEntry />
        <SectionEntry />
        <SectionTitle title="COIN" />
        <SectionEntry />
        <SectionEntry />
        <SectionTitle title="TOOLS" />
        <SectionEntry />
        <SectionEntry />
        <SectionEntry />
        <SectionTitle title="ACCOUNTS" />
        <SectionEntry />
        <SectionTitle title="ABOUT LEDGET WALLET" />
        <SectionEntry />
        <SectionEntry />
        <SectionTitle title="HELP" />
        <SectionEntry />
        <SectionEntry />
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
  sectionEntryLabel: {
    color: "#666",
    fontWeight: "bold"
  },
  sectionEntryCenter: {
    justifyContent: "center"
  },
  signOutText: {
    color: "#c00"
  }
});
