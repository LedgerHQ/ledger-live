// @flow
import { createCustomErrorClass } from "@ledgerhq/errors";

// TODO we need to migrate in all errors that are in @ledgerhq/errors
// but only make sense to live-common to not pollute ledgerjs

export const TransactionRefusedOnDevice = createCustomErrorClass(
  "TransactionRefusedOnDevice"
);
