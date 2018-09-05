/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import type { Result } from "@ledgerhq/live-common/lib/bridgestream/types";
import HeaderTitle from "../../components/HeaderTitle";
import HeaderRightClose from "../../components/HeaderRightClose";
import PresentResult from "./PresentResult";
import Scanning from "./Scanning";
import colors from "../../colors";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  transparentHeader: {
    backgroundColor: "transparent",
    paddingTop: StatusBar.currentHeight,
  },
});

class ImportAccounts extends Component<
  {
    navigation: *,
  },
  {
    result: ?Result,
    accepted: boolean,
  },
> {
  static navigationOptions = ({ navigation }: *) => ({
    title: "Import Accounts",
    headerTransparent: true,
    headerStyle: styles.transparentHeader,
    headerRight: (
      <HeaderRightClose navigation={navigation} color={colors.white} />
    ),
    headerLeft: null,
    headerTitle: (props: *) => (
      <HeaderTitle {...props} style={{ color: "white" }} />
    ),
  });

  state = {
    accepted: false,
    result: null,
  };

  onAccept = () => {
    this.setState({ accepted: true });
  };

  onResult = (result: Result) => {
    this.setState({ result });
  };

  onDone = () => {
    this.props.navigation.goBack();
  };

  render() {
    const { result } = this.state;

    return (
      <View style={styles.container}>
        {result ? (
          <PresentResult result={result} onDone={this.onDone} />
        ) : (
          <Scanning onResult={this.onResult} />
        )}
      </View>
    );
  }
}

export default ImportAccounts;
