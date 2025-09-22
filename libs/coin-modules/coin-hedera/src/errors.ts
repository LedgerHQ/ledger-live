import { createCustomErrorClass } from "@ledgerhq/errors";

export const HederaAddAccountError = createCustomErrorClass("HederaAddAccountError");
export const HederaMemoIsTooLong = createCustomErrorClass("HederaMemoIsTooLong");
