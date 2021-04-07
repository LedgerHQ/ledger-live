// @flow
import React, { PureComponent } from "react";
import { KeyboardAvoidingView, Platform, NativeModules } from "react-native";

const { DeviceInfo } = NativeModules;

type Props = {
  style?: *,
  children: React$Node,
};

class KeyboardView extends PureComponent<Props> {
  static defaultProps = {
    style: {
      flex: 1,
    },
  };

  render(): React$Node {
    const { style, children } = this.props;
    let behavior;
    let keyboardVerticalOffset = 0;
    if (Platform.OS === "ios") {
      keyboardVerticalOffset = DeviceInfo.isIPhoneX_deprecated ? 88 : 64;
      behavior = "padding";
    }

    return (
      <KeyboardAvoidingView
        style={style}
        keyboardVerticalOffset={keyboardVerticalOffset}
        behavior={behavior}
        enabled
      >
        {children}
      </KeyboardAvoidingView>
    );
  }
}

export default KeyboardView;
