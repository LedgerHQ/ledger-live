/* @flow */

import { TextInput as ReactNativeTextInput } from "react-native";
import React, { PureComponent } from "react";

class TextInput extends PureComponent<*> {
  render() {
    const {
      containerStyle, // Needed to pass flow, since we call the native TextInput
      withSuggestions,
      innerRef,
      ...otherProps
    } = this.props;

    const flags = {};

    if (!withSuggestions) {
      flags.autoCorrect = false;
    }

    return <ReactNativeTextInput ref={innerRef} {...otherProps} {...flags} />;
  }
}

// $FlowFixMe https://github.com/facebook/flow/pull/5920
export default React.forwardRef((props, ref) => (
  <TextInput innerRef={ref} {...props} />
));
