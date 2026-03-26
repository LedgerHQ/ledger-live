import { createCustomErrorClass } from "@ledgerhq/errors";
import { LedgerErrorConstructor } from "@ledgerhq/errors/helpers";

export const InvalidAddressBecauseAlreadyDelegated = createCustomErrorClass(
  "InvalidAddressBecauseAlreadyDelegated",
);
export const UnsupportedTransactionMode = createCustomErrorClass<
  { mode: string },
  LedgerErrorConstructor<{ mode: string }>
>("UnsupportedTransactionMode");
