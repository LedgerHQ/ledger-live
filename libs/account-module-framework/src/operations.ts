/**
 * The operation types whose native value includes the fee: the account sends them and, whoever
 * paid the fee, its balance changes by value + fee. Other types (IN, FREEZE, VOTE, OPT_IN...) keep
 * the coin module's value.
 */
export const FEE_INCLUSIVE_OPERATION_TYPES: ReadonlySet<string> = new Set([
  "OUT",
  "FEES",
  "DELEGATE",
  "UNDELEGATE",
  "REDELEGATE",
  "CONTRACT_CALL",
  "UPDATE_ACCOUNT",
]);
