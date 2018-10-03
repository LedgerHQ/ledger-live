// @flow
import React, { PureComponent } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";

type Props = {
  style?: *,
  children: React$Node,
};

class KeyboardView extends PureComponent<Props> {
  static defaultProps = {
    style: {},
  };

  render(): React$Node {
    const { style, children, ...rest } = this.props;
    let behavior;
    let keyboardVerticalOffset = 0;
    if (Platform.OS === "ios") {
      keyboardVerticalOffset = 64;
      behavior = "padding";
    }

    return (
      <KeyboardAvoidingView
        style={style}
        keyboardVerticalOffset={keyboardVerticalOffset}
        behavior={behavior}
        enabled
        {...rest}
      >
        {children}
      </KeyboardAvoidingView>
    );
  }
}

export default KeyboardView;
