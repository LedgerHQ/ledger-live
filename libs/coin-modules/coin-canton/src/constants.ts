export const CANTON_UNSET_RECIPIENT =
  "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// The Canton device app rejects a node with more than 32 children, and a transfer's root node has
// 3n + 6 children for n inputs, so the device signs at most 8 inputs.
export const TO_MANY_UTXOS_CRITICAL_COUNT = 8;
export const TO_MANY_UTXOS_WARNING_COUNT = 6;
