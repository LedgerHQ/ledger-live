import React, { PureComponent } from "react";
import { Platform, TouchableWithoutFeedback, Keyboard, EmitterSubscription } from "react-native";

type Props = {
  children?: React.ReactNode;
};

class KeyboardBackgroundDismiss extends PureComponent<Props> {
  keyboardDidHideListener: EmitterSubscription | undefined;

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    if (Platform.OS === "android") {
      this.keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", Keyboard.dismiss);
    }
  }

  componentWillUnmount() {
    if (Platform.OS === "android") {
      this.keyboardDidHideListener?.remove();
    }
  }

  render() {
    const { children } = this.props;
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>{children}</TouchableWithoutFeedback>
    );
  }
}

export default KeyboardBackgroundDismiss;
