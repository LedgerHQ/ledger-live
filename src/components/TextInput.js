/* @flow */
import React from "react";
import { Platform, TextInput as ReactNativeTextInput } from "react-native";

// $FlowFixMe https://github.com/facebook/flow/pull/5920
const TextInput = React.forwardRef((props, ref) => {
  const { withSuggestions, ...otherProps } = props;
  const flags = {};
  if (!withSuggestions) {
    flags.autoCorrect = false;
    if (Platform.OS === "android") {
      flags.keyboardType = "visible-password";
    }
  }
  return <ReactNativeTextInput ref={ref} {...otherProps} {...flags} />;
});

export default TextInput;
