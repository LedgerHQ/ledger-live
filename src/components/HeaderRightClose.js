/* @flow */
import React, { Component } from "react";
import type { NavigationScreenProp } from "react-navigation";
import Touchable from "./Touchable";
import CloseIcon from "../icons/Close";
import colors from "../colors";

export default class Close extends Component<{
  preferDismiss: boolean,
  navigation: NavigationScreenProp<*>,
  color: string,
}> {
  static defaultProps = {
    color: colors.grey,
    preferDismiss: true,
  };

  onPress = () => {
    const { navigation, preferDismiss } = this.props;

    if (navigation.dismiss && preferDismiss) {
      const dismissed = navigation.dismiss();

      if (!dismissed) navigation.goBack();
    }

    if (navigation.closeDrawer) navigation.closeDrawer();

    navigation.goBack();
  };

  render() {
    return (
      <Touchable onPress={this.onPress} style={{ marginHorizontal: 16 }}>
        <CloseIcon size={18} color={this.props.color} />
      </Touchable>
    );
  }
}
