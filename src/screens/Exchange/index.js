// @flow

import React, { Component } from "react";
import { translate, Trans } from "react-i18next";
import { StyleSheet, SafeAreaView } from "react-native";
import type { NavigationScreenProp } from "react-navigation";

import LText from "../../components/LText";

import colors from "../../colors";

type Props = {
  navigation: NavigationScreenProp<*>,
};

class ExchangeScreen extends Component<Props> {
  static navigationOptions = {
    header: null,
  };

  render() {
    return (
      <SafeAreaView style={styles.root}>
        <LText style={{ fontSize: 24 }}>
          <Trans i18nKey="exchange.title" />
        </LText>
        <LText style={{ fontSize: 12 }}>TODO: integrate.</LText>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.lightGrey,
  },
});

export default translate()(ExchangeScreen);
