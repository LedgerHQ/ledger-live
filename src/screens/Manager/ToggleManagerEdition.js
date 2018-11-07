/* @flow */
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import Touchable from "../../components/Touchable";
import LText from "../../components/LText";
import colors from "../../colors";

class ToggleManagerEdition extends Component<*> {
  onPress = () => {
    const { navigation } = this.props;
    const editMode = !navigation.getParam("editMode");
    navigation.setParams({ editMode });
  };

  render() {
    return (
      <Touchable onPress={this.onPress}>
        <LText secondary semiBold style={styles.text}>
          EDIT
        </LText>
      </Touchable>
    );
  }
}

export default withNavigation(ToggleManagerEdition);

const styles = StyleSheet.create({
  text: {
    color: colors.darkBlue,
    fontSize: 16,
    padding: 10,
  },
});
