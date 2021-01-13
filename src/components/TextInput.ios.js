/* @flow */

import { TextInput as ReactNativeTextInput } from "react-native";
import React, { PureComponent } from "react";
import { useTheme } from "@react-navigation/native";

class TextInput extends PureComponent<*> {
  render() {
    const {
      containerStyle, // Needed to pass flow, since we call the native TextInput
      withSuggestions,
      innerRef,
      style,
      colors,
      ...otherProps
    } = this.props;

    const flags = {};

    if (!withSuggestions) {
      flags.autoCorrect = false;
    }

    return (
      <ReactNativeTextInput
        ref={innerRef}
        allowFontScaling={false}
        {...otherProps}
        {...flags}
        style={[style, { color: colors.darkBlue }]}
      />
    );
  }
}

// $FlowFixMe https://github.com/facebook/flow/pull/5920
export default React.forwardRef((props, ref) => {
  const { colors } = useTheme();
  return <TextInput innerRef={ref} colors={colors} {...props} />;
});
