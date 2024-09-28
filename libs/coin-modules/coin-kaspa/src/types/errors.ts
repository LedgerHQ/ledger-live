import { createCustomErrorClass } from "@ledgerhq/errors";

/**
 * MyCoin error thrown on a specifc check done on a transaction amount
 */
export const MyCoinSpecificError = createCustomErrorClass(
  "MyCoinSpecificError"
);