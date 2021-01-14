/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import Icon from "react-native-vector-icons/dist/Feather";
import Touchable from "./Touchable";
import { getFontStyle } from "./LText";
import { withTheme } from "../colors";

type Props = {
  secureTextEntry: boolean,
  onChange: string => void,
  onSubmit: () => void,
  toggleSecureTextEntry: () => void,
  placeholder: string,
  autoFocus?: boolean,
  inline?: boolean,
  onFocus?: *,
  onBlur?: *,
  error?: ?Error,
  password?: string,
  colors: *,
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
      colors,
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
          !inline && {
            ...styles.nonInlineContainer,
            backgroundColor: colors.white,
            borderColor: colors.lightFog,
          },
          borderColorOverride,
        ]}
      >
        <TextInput
          allowFontScaling={false}
          autoFocus={autoFocus}
          style={[
            styles.input,
            getFontStyle({ semiBold: true }),
            inline && styles.inlineTextInput,
            { color: colors.darkBlue },
          ]}
          placeholder={placeholder}
          placeholderTextColor={error ? colors.alert : colors.grey}
          returnKeyType="done"
          blurOnSubmit={false}
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
          <Touchable
            event="PasswordInputToggleUnsecure"
            style={styles.iconInput}
            onPress={toggleSecureTextEntry}
          >
            <Icon
              name="eye"
              size={16}
              color={inline ? colors.grey : colors.fog}
            />
          </Touchable>
        ) : (
          <Touchable
            event="PasswordInputToggleSecure"
            style={styles.iconInput}
            onPress={toggleSecureTextEntry}
          >
            <Icon
              name="eye-off"
              size={16}
              color={inline ? colors.grey : colors.fog}
            />
          </Touchable>
        )}
      </View>
    );
  }
}

export default withTheme(PasswordInput);
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 4,
    marginBottom: 16,
  },
  nonInlineContainer: {
    borderWidth: 1,
  },
  inlineTextInput: {
    fontSize: 20,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 16,
    height: 48,
    flex: 1,
  },
  iconInput: {
    justifyContent: "center",
    marginRight: 16,
  },
});
