/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import Icon from "react-native-vector-icons/dist/FontAwesome";
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
  withBorder?: boolean,
  onFocus?: *,
  onBlur?: *,
  error?: ?Error,
};

class PasswordInput extends PureComponent<Props> {
  render() {
    const {
      autoFocus,
      error,
      secureTextEntry,
      onChange,
      onSubmit,
      toggleSecureTextEntry,
      placeholder,
      withBorder,
      onFocus,
      onBlur,
    } = this.props;
    return (
      <View style={[styles.container, withBorder && styles.withBorder]}>
        <TextInput
          autoFocus={autoFocus}
          style={[
            styles.input,
            getFontStyle({ semiBold: true }),
            { color: error ? colors.alert : colors.darkBlue },
          ]}
          placeholder={placeholder}
          placeholderTextColor={error ? colors.alert : colors.lightFog}
          returnKeyType="done"
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          secureTextEntry={secureTextEntry}
          textContentType="password"
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {secureTextEntry ? (
          <Touchable style={styles.iconInput} onPress={toggleSecureTextEntry}>
            <Icon name="eye-slash" size={16} color={colors.grey} />
          </Touchable>
        ) : (
          <Touchable style={styles.iconInput} onPress={toggleSecureTextEntry}>
            <Icon name="eye" size={16} color={colors.grey} />
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
    backgroundColor: colors.white,
    borderRadius: 4,
    marginBottom: 16,
  },
  withBorder: {
    borderWidth: 1,
    borderColor: colors.lightFog,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flex: 1,
  },
  iconInput: {
    justifyContent: "center",
    marginRight: 16,
  },
});
