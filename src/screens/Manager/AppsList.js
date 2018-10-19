/* @flow */
import React, { Component } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";

const Header = () => (
  <View
    style={{
      height: 42,
      borderWidth: 1,
      borderColor: "#d8d8d8",
      backgroundColor: "white",
      borderRadius: 4,
      marginBottom: 20,
    }}
  />
);

const AppsList = () => (
  <FlatList
    renderItem={() => (
      <View
        style={{
          marginBottom: 8,
          height: 70,
          backgroundColor: "white",
          borderRadius: 4,
        }}
      />
    )}
    data={Array(40)
      .fill(null)
      .map((_, id) => ({ id }))}
  />
);

class ManagerAppsList extends Component<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "App catalog",
  };

  render() {
    return (
      <View style={styles.root}>
        <Header />
        <AppsList />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
  },
});

export default ManagerAppsList;
