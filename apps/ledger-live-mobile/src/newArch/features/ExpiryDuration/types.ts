import type { Transaction } from "@ledgerhq/live-common/generated/types";

export type TxPatch<T extends Transaction> = (tx: T) => T;

export type ExpiryDurationInputProps<T extends Transaction = Transaction> = {
  onChange: (update: { patch: TxPatch<T>; value: number; error?: Error }) => void;
  testID?: string;
};
