import { createCustomErrorClass } from "@ledgerhq/errors";

/**
 * Icon error thrown on a specifc check done on a transaction amount
 */
export const IconSpecificError = createCustomErrorClass("IconSpecificError");
