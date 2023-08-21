import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, StyleSheet, TextInput, TextInputProps } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import Touchable from "./Touchable";
import { getFontStyle } from "./LText";
import { Theme, withTheme } from "../colors";

type Props = {
  secureTextEntry: boolean;
  onChange: (_: string) => void;
  onSubmit: () => void;
  toggleSecureTextEntry: () => void;
  placeholder: string;
  autoFocus?: boolean;
  inline?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: Error | null;
  password?: string;
  colors: Theme["colors"];
  testID?: TextInputProps["testID"];
};

const PasswordInput = ({
  autoFocus,
  error,
  secureTextEntry,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  toggleSecureTextEntry,
  placeholder,
  inline,
  password,
  colors,
  testID,
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
    }
  }, [autoFocus]);

  const wrappedOnFocus = useCallback(() => {
    setIsFocused(true);
    onFocus && onFocus();
  }, [onFocus]);

  const wrappedOnBlur = useCallback(() => {
    setIsFocused(false);
    onBlur && onBlur();
  }, [onBlur]);

  let borderColorOverride = {};
  if (!inline && isFocused) {
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
          backgroundColor: colors.card,
          borderColor: colors.lightFog,
        },
        borderColorOverride,
      ]}
    >
      <TextInput
        allowFontScaling={false}
        autoFocus={autoFocus}
        ref={ref}
        style={[
          styles.input,
          getFontStyle({ semiBold: true }),
          inline && styles.inlineTextInput,
          { color: colors.darkBlue },
        ]}
        placeholder={placeholder}
        placeholderTextColor={error ? colors.alert : colors.fog}
        returnKeyType="done"
        blurOnSubmit={false}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        secureTextEntry={secureTextEntry}
        textContentType="password"
        autoCorrect={false}
        onFocus={wrappedOnFocus}
        onBlur={wrappedOnBlur}
        value={password}
        testID={testID}
      />
      {secureTextEntry ? (
        <Touchable
          event="PasswordInputToggleUnsecure"
          style={styles.iconInput}
          onPress={toggleSecureTextEntry}
        >
          <Icon name="eye" size={16} color={inline ? colors.grey : colors.fog} />
        </Touchable>
      ) : (
        <Touchable
          event="PasswordInputToggleSecure"
          style={styles.iconInput}
          onPress={toggleSecureTextEntry}
        >
          <Icon name="eye-off" size={16} color={inline ? colors.grey : colors.fog} />
        </Touchable>
      )}
    </View>
  );
};

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
