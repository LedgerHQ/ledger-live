import React, { useState, useCallback } from "react";
import { View, StyleSheet, TextInput, TextInputProps } from "react-native";
import Touchable from "./Touchable";
import { getFontStyle } from "./LText";
import { Theme, withTheme } from "../colors";
import { Icons } from "@ledgerhq/native-ui";

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

const getBorderColor = (
  isInline: boolean,
  isFocused: boolean,
  error: Error | null | undefined,
  colors: Theme["colors"],
) => {
  if (isInline) return undefined;
  if (!isFocused) return undefined;
  return error ? colors.alert : colors.live;
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

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (onFocus) onFocus();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (onBlur) onBlur();
  }, [onBlur]);

  const borderColor = getBorderColor(!!inline, isFocused, error, colors);

  const touchableEvent = secureTextEntry
    ? "PasswordInputToggleUnsecure"
    : "PasswordInputToggleSecure";

  return (
    <View
      style={[
        styles.container,
        !inline && {
          ...styles.nonInlineContainer,
          backgroundColor: colors.card,
          borderColor: colors.lightFog,
          ...(borderColor ? { borderColor } : {}),
        },
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
        placeholderTextColor={error ? colors.alert : colors.fog}
        returnKeyType="done"
        blurOnSubmit={false}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        secureTextEntry={secureTextEntry}
        textContentType="password"
        autoCorrect={false}
        onFocus={handleFocus}
        onBlur={handleBlur}
        value={password}
        testID={testID}
      />
      <TouchableIcon
        touchableEvent={touchableEvent}
        onPress={toggleSecureTextEntry}
        secureTextEntry={secureTextEntry}
        colors={colors}
      />
    </View>
  );
};

export default withTheme(PasswordInput);

interface TouchableIconProps {
  touchableEvent: string;
  onPress: () => void;
  secureTextEntry: boolean;
  colors: Theme["colors"];
}

const TouchableIcon = ({
  touchableEvent,
  onPress,
  secureTextEntry,
  colors,
}: TouchableIconProps) => {
  return (
    <Touchable event={touchableEvent} style={styles.iconInput} onPress={onPress}>
      {secureTextEntry ? (
        <Icons.Eye size="S" color={colors.grey} />
      ) : (
        <Icons.EyeCross size="S" color={colors.grey} />
      )}
    </Touchable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 4,
    paddingHorizontal: 16,
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
    height: 48,
    flex: 1,
  },
  iconInput: {
    justifyContent: "center",
    marginRight: 16,
  },
});
