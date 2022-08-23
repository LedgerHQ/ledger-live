// @flow

import React, { PureComponent } from "react";
import { Platform, TouchableWithoutFeedback, Keyboard } from "react-native";

type Props = {
  children: any,
};

class KeyboardBackgroundDismiss extends PureComponent<Props> {
  keyboardDidHideListener: *;

  componentWillMount() {
    if (Platform.OS === "android") {
      this.keyboardDidHideListener = Keyboard.addListener(
        "keyboardDidHide",
        Keyboard.dismiss,
      );
    }
  }

  componentWillUnmount() {
    if (Platform.OS === "android") {
      this.keyboardDidHideListener.remove();
    }
  }

  render() {
    const { children } = this.props;
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {children}
      </TouchableWithoutFeedback>
    );
  }
}

export default KeyboardBackgroundDismiss;
