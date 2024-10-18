import type { ViewStyle } from "react-native";
import type { Transaction } from "@ledgerhq/live-common/generated/types";

export type MemoTagInputProps<T extends Transaction = Transaction> = {
  onChange: (update: { patch: Partial<T>; isMemoTagSet: boolean }) => void;
  style?: ViewStyle;
};
