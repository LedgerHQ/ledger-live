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
  inline?: boolean,
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
      inline,
      onFocus,
      onBlur,
    } = this.props;
    return (
      <View style={[styles.container, !inline && styles.nonInlineContainer]}>
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
            <Icon
              name="eye-slash"
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
