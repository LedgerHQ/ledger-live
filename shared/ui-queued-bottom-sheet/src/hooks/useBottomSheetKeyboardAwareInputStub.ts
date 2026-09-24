import type React from "react";
import type { TextInput } from "react-native";

const noop = () => undefined;
const inputProps = { onFocus: noop, onBlur: noop };

export function useBottomSheetKeyboardAwareInput(_inputRef?: React.RefObject<TextInput | null>) {
  return inputProps;
}
