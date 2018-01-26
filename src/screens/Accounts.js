/* @flow */
import React, { Component } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity
} from "react-native";
import ScreenGeneric from "../components/ScreenGeneric";
import colors from "../colors";

export default class Accounts extends Component<*, *> {
  static navigationOptions = {
    tabBarIcon: ({ tintColor }: *) => (
      <Image
        source={require("../images/accounts.png")}
        style={{ tintColor, width: 32, height: 32 }}
      />
    )
  };
  state: { bitcoinAddress: ?string, expandedMode: boolean } = {
    bitcoinAddress: null,
    expandedMode: false
  };
  renderHeader = () => {
    const { expandedMode } = this.state;
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={this.toggleExpandedMode}>
          <Image
            source={
              expandedMode
                ? require("../images/accountsmenutoggled.png")
                : require("../images/accountsmenu.png")
            }
            style={{ width: 24, height: 20 }}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Accounts</Text>
        <TouchableOpacity onPress={this.goToAddAccount}>
          <Image
            source={require("../images/accountsplus.png")}
            style={{ width: 22, height: 21 }}
          />
        </TouchableOpacity>
      </View>
    );
  };

  toggleExpandedMode = () => {
    this.setState(({ expandedMode }) => ({ expandedMode: !expandedMode }));
  };

  goToAddAccount = () => {
    this.props.screenProps.topLevelNavigation.navigate("AddAccount");
  };

  onGoAccountSettings = () => {
    this.props.screenProps.topLevelNavigation.navigate("AccountSettings", {
      accountId: "42"
    });
  };

  render() {
    const { bitcoinAddress, expandedMode } = this.state;
    // FIXME this is not so clean. we might need to use react-navigation for the expanded mode as well...
    return (
      <View style={styles.root}>
        <ScreenGeneric
          key={String(expandedMode) /* force a redraw */}
          renderHeader={this.renderHeader}
        >
          <ScrollView bounces={false} style={styles.body}>
            {expandedMode ? (
              <View style={styles.expanded}>
                {Array(20)
                  .fill(null)
                  .map((_, i) => (
                    <View
                      key={i}
                      style={{
                        marginVertical: 6,
                        marginHorizontal: 16,
                        height: 60,
                        borderRadius: 4,
                        backgroundColor: "white"
                      }}
                    />
                  ))}
              </View>
            ) : (
              <View>
                <View style={styles.carouselCountainer}>
                  <View
                    style={{
                      margin: 20,
                      width: 280,
                      height: 220,
                      padding: 10,
                      alignItems: "flex-end",
                      backgroundColor: "white"
                    }}
                  >
                    <TouchableOpacity onPress={this.onGoAccountSettings}>
                      <Image
                        source={require("../images/accountsettings.png")}
                        style={{ width: 30, height: 30 }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ height: 800 }}>
                  <Text>{bitcoinAddress}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </ScreenGeneric>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  body: {
    flex: 1
  },
  carouselCountainer: {
    height: 300,
    backgroundColor: colors.blue
  },
  expanded: {
    backgroundColor: colors.blue
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    flex: 1
  },
  headerText: {
    color: "white",
    fontSize: 16
  }
});
