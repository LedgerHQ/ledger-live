import { createCustomErrorClass } from "@ledgerhq/errors";
import { LedgerErrorConstructor } from "@ledgerhq/errors/helpers";

export const InvalidAddressBecauseAlreadyDelegated = createCustomErrorClass(
  "InvalidAddressBecauseAlreadyDelegated",
);
export const UnsupportedTransactionMode = createCustomErrorClass<
  { mode: string },
  LedgerErrorConstructor<{ mode: string }>
>("UnsupportedTransactionMode");
export const UnsupportedOperationKind = createCustomErrorClass<
  { kind: string },
  LedgerErrorConstructor<{ kind: string }>
>("UnsupportedOperationKind");
export const MustDelegateBeforeStaking = createCustomErrorClass("MustDelegateBeforeStaking");
export const TezosNotEnoughStaked = createCustomErrorClass("TezosNotEnoughStaked");
