/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { listFiats } from "@ledgerhq/currencies";
import LText from "../../components/LText";

class SelectFiatUnit extends Component<{
  navigation: *
}> {
  static navigationOptions = {
    title: "Countervalue currency"
  };
  render() {
    console.log(listFiats());

    return (
      <View style={styles.container}>
        <View style={styles.body}>
          <LText>KIKOU</LText>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  body: {
    flex: 1,
    padding: 20,
    justifyContent: "center"
  }
});

export default SelectFiatUnit;
