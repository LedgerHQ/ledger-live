import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { AnimatedInputProps } from "@ledgerhq/native-ui/components/Form/Input/AnimatedInput";

export type MemoTagInputProps<T extends Transaction = Transaction> = Omit<
  AnimatedInputProps,
  "value" | "onChangeText" | "onChange"
> & { onChange: (update: { patch: Partial<T>; isEmpty: boolean }) => void };
