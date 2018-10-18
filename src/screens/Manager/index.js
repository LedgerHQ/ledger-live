/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import SelectDevice from "../../components/SelectDevice";
import ToggleManagerEdition from "./ToggleManagerEdition";

class Manager extends Component<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "Manager",
    headerRight: <ToggleManagerEdition />,
  };

  onSelect = (deviceId: string) => {
    this.props.navigation.navigate("ManagerMain", {
      deviceId,
    });
  };

  render() {
    const editMode = this.props.navigation.getParam("editMode");
    return (
      <View style={styles.root}>
        <SelectDevice onSelect={this.onSelect} editMode={editMode} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default Manager;
