/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import Touchable from "./Touchable";
import { getFontStyle } from "./LText";
import colors from "../colors";

type Props = {
  secureTextEntry: boolean,
  onChange: string => void,
  onSubmit: string => void,
  toggleSecureTextEntry: () => void,
  placeholder: string,
  autoFocus?: boolean,
  inline?: boolean,
  onFocus?: *,
  onBlur?: *,
  error?: ?Error,
  password?: string,
};

class PasswordInput extends PureComponent<Props, { isFocused: boolean }> {
  state = { isFocused: false };

  onFocus = () => {
    const { onFocus } = this.props;
    this.setState({ isFocused: true });
    onFocus && onFocus();
  };
  onBlur = () => {
    const { onBlur } = this.props;
    this.setState({ isFocused: false });
    onBlur && onBlur();
  };

  render() {
    const {
      autoFocus,
      error,
      secureTextEntry,
      onChange,
      onSubmit,
      toggleSecureTextEntry,
      placeholder,
      inline,
      password,
    } = this.props;

    let borderColorOverride = {};
    if (!inline && this.state.isFocused) {
      if (error) {
        borderColorOverride = { borderColor: colors.alert };
      } else {
        borderColorOverride = { borderColor: colors.live };
      }
    }

    return (
      <View
        style={[
          styles.container,
          !inline && styles.nonInlineContainer,
          borderColorOverride,
        ]}
      >
        <TextInput
          autoFocus={autoFocus}
          style={[
            styles.input,
            getFontStyle({ semiBold: true }),
            { color: error ? colors.alert : colors.darkBlue },
            inline && styles.inlineTextInput,
          ]}
          placeholder={placeholder}
          placeholderTextColor={error ? colors.alert : colors.fog}
          returnKeyType="done"
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          secureTextEntry={secureTextEntry}
          textContentType="password"
          autoCorrect={false}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          value={password}
        />
        {secureTextEntry ? (
          <Touchable style={styles.iconInput} onPress={toggleSecureTextEntry}>
            <Icon
              name="eye-off"
              size={16}
              color={inline ? colors.grey : colors.fog}
            />
          </Touchable>
        ) : (
          <Touchable style={styles.iconInput} onPress={toggleSecureTextEntry}>
            <Icon
              name="eye"
              size={16}
              color={inline ? colors.grey : colors.fog}
            />
          </Touchable>
        )}
      </View>
    );
  }
}

export default PasswordInput;
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 4,
    marginBottom: 16,
  },
  nonInlineContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightFog,
  },
  inlineTextInput: {
    fontSize: 20,
  },
  input: {
    fontSize: 14,
    paddingHorizontal: 16,
    height: 48,
    flex: 1,
  },
  iconInput: {
    justifyContent: "center",
    marginRight: 16,
  },
});
