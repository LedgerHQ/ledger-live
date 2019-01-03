/* @flow */

import React, { PureComponent } from "react";
import {
  View,
  TextInput as ReactNativeTextInput,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/dist/Ionicons";
import colors from "../colors";
import Touchable from "./Touchable";

type State = {
  focused: boolean,
  value: string,
};

class TextInput extends PureComponent<*, State> {
  constructor(props) {
    super(props);

    this.state = {
      focused: false,
      value: this.props.value || this.props.defaultValue || "",
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ value: nextProps.value });
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

  clearInput = () => {
    this.setState({ value: "", focused: true });
    if (this.props.onInputCleared) {
      this.props.onInputCleared();
    } else if (this.props.onChangeText) {
      this.props.onChangeText("");
    }
    return true;
  };

  render() {
    const {
      containerStyle,
      withSuggestions,
      innerRef,
      clearButtonMode, // Don't pass this down to use our own impl
      ...otherProps
    } = this.props;

    const { value, focused } = this.state;

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
    return (
      <View style={[styles.container, containerStyle]}>
        <ReactNativeTextInput
          ref={innerRef}
          {...otherProps}
          onBlur={this.onBlur}
          onFocus={this.onFocus}
          onChangeText={this.onChangeText}
          autoFocus={focused}
          value={value}
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
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

// $FlowFixMe https://github.com/facebook/flow/pull/5920
export default React.forwardRef((props, ref) => (
  <TextInput innerRef={ref} {...props} />
));
