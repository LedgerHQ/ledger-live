/* @flow */

import { TextInput as ReactNativeTextInput } from "react-native";
import React, {
  PureComponent,
  useRef,
  useEffect,
  useImperativeHandle,
} from "react";
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
  const { colors, dark } = useTheme();
  const inputRef = useRef();
  // allows to still forward ref to parent to call
  useImperativeHandle(ref, () => inputRef.current);
  useEffect(() => {
    props.autoFocus && inputRef.current?.focus();
  }, [props, ref]);
  return (
    <TextInput
      innerRef={inputRef}
      colors={colors}
      keyboardAppearance={dark ? "dark" : "light"}
      {...props}
    />
  );
});
