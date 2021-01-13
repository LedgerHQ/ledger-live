/* @flow */

import React, { PureComponent } from "react";
import {
  View,
  TextInput as ReactNativeTextInput,
  StyleSheet,
  PixelRatio,
} from "react-native";
import Icon from "react-native-vector-icons/dist/Ionicons";
import { useTheme } from "@react-navigation/native";
import Touchable from "./Touchable";

type State = {
  focused: boolean,
  value: string,
  height: number,
};

class TextInput extends PureComponent<*, State> {
  constructor(props) {
    super(props);
    this.state = {
      focused: this.props.autoFocus || false,
      value: this.props.defaultValue || "",
      height: 1,
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.value !== undefined && props.value !== state.value) {
      return { value: props.value };
    }
    return null;
  }

  onFocus = () => {
    this.setState({ focused: true });
    if (this.props.onFocus) {
      this.props.onFocus();
    }
  };

  onBlur = () => {
    this.setState({ focused: false });
    if (this.props.onBlur) {
      this.props.onBlur();
    }
  };

  onChangeText = text => {
    this.setState({ value: text, focused: true });
    if (this.props.onChangeText) {
      this.props.onChangeText(text);
    }
  };

  onContentSizeChange = event => {
    const { height } = event.nativeEvent.contentSize;

    this.setState({ height });
  };

  clearInput = () => {
    this.setState({ value: "", focused: true });
    if (this.props.onInputCleared) {
      this.props.onInputCleared();
    }
  };

  render() {
    const {
      containerStyle,
      withSuggestions,
      innerRef,
      style,
      defaultValue,
      clearButtonMode, // Don't pass this down to use our own impl
      colors,
      ...otherProps
    } = this.props;

    const { value, focused } = this.state;

    const flatStyle = style ? StyleSheet.flatten(style) : {};
    const { fontSize, height } = flatStyle;

    const flags = {};

    if (!withSuggestions) {
      flags.autoCorrect = false;
      flags.keyboardType = "visible-password";
    }
    const shouldShowClearButton =
      !!value &&
      ((focused && clearButtonMode === "while-editing") ||
        clearButtonMode === "always");
    // {...otherProps} needs to come first to allow an override.

    // Preprocess the font size to override system scaling
    const overrideFontScaling = {
      fontSize: (fontSize || 20) / PixelRatio.getFontScale(),
    };

    const dynamicHeight = {};
    if (!height && this.props.multiline) {
      dynamicHeight.height = this.state.height;
    }

    return (
      <View style={[styles.container, containerStyle]}>
        <ReactNativeTextInput
          ref={innerRef}
          style={[
            { flex: 1, color: colors.darkBlue },
            style,
            overrideFontScaling,
            dynamicHeight,
          ]}
          {...otherProps}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          onChangeText={this.onChangeText}
          onContentSizeChange={
            dynamicHeight.height ? this.onContentSizeChange : undefined
          }
          autoFocus={focused}
          value={value}
          allowFontScaling={false}
          {...flags}
        />
        {!!shouldShowClearButton && (
          <Touchable
            style={styles.clearWrapper}
            event="TextInputClearValue"
            onPress={this.clearInput}
          >
            <Icon name="ios-close-circle" color={colors.grey} size={20} />
          </Touchable>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  clearWrapper: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

// $FlowFixMe https://github.com/facebook/flow/pull/5920
export default React.forwardRef((props, ref) => {
  const { colors } = useTheme();
  return <TextInput innerRef={ref} colors={colors} {...props} />;
});
