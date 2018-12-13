// @flow
import React from "react";
import { View, Keyboard } from "react-native";
import { BottomTabBar } from "react-navigation-tabs";

export default class HiddenTabBarIfKeyboardVisible extends React.PureComponent<
  *,
  { isKeyboardVisible: boolean },
> {
  keyboardDidShowListener: *;
  keyboardDidHideListener: *;

  state = {
    isKeyboardVisible: false,
  };

  keyboardHide = () => {
    this.setState({ isKeyboardVisible: false });
  };

  keyboardDidShow = () => {
    this.setState({ isKeyboardVisible: true });
  };

  componentWillMount() {
    this.keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      this.keyboardDidShow,
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      this.keyboardHide,
    );
  }
  componentWillUnmount() {
    Keyboard.removeListener("keyboardDidShow", this.keyboardDidShowListener);
    Keyboard.removeListener("keyboardDidHide", this.keyboardDidHideListener);
  }

  render() {
    const { isKeyboardVisible } = this.state;
    return !isKeyboardVisible ? <BottomTabBar {...this.props} /> : <View />;
  }
}
