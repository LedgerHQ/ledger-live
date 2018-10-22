/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { withNavigationFocus } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import SelectDevice from "../../components/SelectDevice";
import ToggleManagerEdition from "./ToggleManagerEdition";

class Manager extends Component<{
  navigation: NavigationScreenProp<*>,
  isFocused: boolean,
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
    const { isFocused } = this.props;
    if (!isFocused) return null;
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

export default withNavigationFocus(Manager);
