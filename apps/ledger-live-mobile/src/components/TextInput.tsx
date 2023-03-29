import React from "react";
import { Platform, TextInput as NativeTextInput } from "react-native";
import { BaseInput } from "@ledgerhq/native-ui";
import { InputProps } from "@ledgerhq/native-ui/components/Form/Input/BaseInput/index";

export interface Props extends InputProps {
  withSuggestions?: boolean;
}

function TextInput(
  { withSuggestions, ...props }: Props,
  ref?: React.ForwardedRef<NativeTextInput>,
) {
  const flags: Partial<InputProps> = {};

  if (!withSuggestions) {
    flags.autoCorrect = false;
    if (Platform.OS === "android") flags.keyboardType = "visible-password";
  }

  return <BaseInput ref={ref} {...flags} {...props} />;
}

export default React.forwardRef(TextInput);
