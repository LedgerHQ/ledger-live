import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { InputProps } from "@ledgerhq/native-ui/components/Form/Input/BaseInput/index";

export type TxPatch<T extends Transaction> = (tx: T) => T;

export type MemoTagInputProps<T extends Transaction = Transaction> = Omit<
  InputProps,
  "value" | "onChangeText" | "onChange"
> & { onChange: (update: { patch: TxPatch<T>; value: string; error?: Error }) => void };
