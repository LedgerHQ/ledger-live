/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { withNavigationFocus } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { connectingStep, dashboard } from "../../components/SelectDevice/steps";
import SelectDevice from "../../components/SelectDevice";
import colors from "../../colors";
import ToggleManagerEdition from "./ToggleManagerEdition";

class Manager extends Component<{
  navigation: NavigationScreenProp<*>,
  isFocused: boolean,
}> {
  static navigationOptions = {
    title: "Manager",
    headerRight: <ToggleManagerEdition />,
  };

  onSelect = (deviceId: string, meta: Object) => {
    this.props.navigation.navigate("ManagerMain", {
      deviceId,
      meta,
    });
  };

  render() {
    const { isFocused } = this.props;
    if (!isFocused) return null;
    const editMode = this.props.navigation.getParam("editMode");
    return (
      <View style={styles.root}>
        <SelectDevice
          onSelect={this.onSelect}
          editMode={editMode}
          steps={[connectingStep, dashboard]}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default withNavigationFocus(Manager);
