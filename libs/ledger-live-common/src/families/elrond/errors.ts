import { createCustomErrorClass } from "@ledgerhq/errors";

export const DecimalsLimitReachedError = createCustomErrorClass(
  "DecimalsLimitReached"
);
