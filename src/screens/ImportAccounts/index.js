/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import PresentResult from "./PresentResult";
import Intro from "./Intro";
import Scanning from "./Scanning";

class ImportAccounts extends Component<
  {
    navigation: *,
  },
  {
    result: ?Result,
    accepted: boolean,
  },
> {
  static navigationOptions = {
    title: "Import Accounts",
  };

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
    const { accepted, result } = this.state;

    return (
      <View style={styles.container}>
        {result ? (
          <PresentResult result={result} onDone={this.onDone} />
        ) : !accepted ? (
          <Intro onAccept={this.onAccept} />
        ) : (
          <Scanning onResult={this.onResult} />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ImportAccounts;
