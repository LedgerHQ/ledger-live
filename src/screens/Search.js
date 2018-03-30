/* @flow */
import React, { Component } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Image,
  TextInput
} from "react-native";
import Touchable from "../components/Touchable";
import ScreenGeneric from "../components/ScreenGeneric";

export default class Search extends Component<*> {
  static navigationOptions = {
    tabBarIcon: ({ tintColor }: *) => (
      <Image
        source={require("../images/search.png")}
        style={{ tintColor, width: 32, height: 32 }}
      />
    )
  };
  onPressCancel = () => {};
  onChangeText = () => {};
  renderHeader = () => (
    <View style={styles.header}>
      <TextInput
        placeholder="Search"
        placeholderTextColor="#ddd"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={styles.textInput}
        onChangeText={this.onChangeText}
      />
      <Touchable style={styles.button} onPress={this.onPressCancel}>
        <Text style={styles.buttonText}>Cancel</Text>
      </Touchable>
    </View>
  );
  render() {
    return (
      <ScreenGeneric Header={this.renderHeader}>
        <ScrollView bounces={false} style={styles.container} />
      </ScreenGeneric>
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
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 20
  },
  textInput: {
    color: "white",
    fontSize: 16,
    flex: 1
  },
  button: {},
  buttonText: {
    color: "white"
  }
});
