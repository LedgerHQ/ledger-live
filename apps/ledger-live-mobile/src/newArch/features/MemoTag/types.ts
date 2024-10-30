import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { AnimatedInputProps } from "@ledgerhq/native-ui/components/Form/Input/AnimatedInput";

export type MemoTagInputProps<T extends Transaction = Transaction> = Omit<
  AnimatedInputProps,
  "value" | "onChangeText" | "onChange"
> & { onChange: (update: { patch: Partial<T>; value: string; error?: Error }) => void };
