import { createCustomErrorClass } from "@ledgerhq/errors";

export const CasperInvalidTransferId = createCustomErrorClass("CasperInvalidTransferId");
export const InvalidMinimumAmount = createCustomErrorClass("InvalidMinimumAmount");
export const MayBlockAccount = createCustomErrorClass("MayBlockAccount");
