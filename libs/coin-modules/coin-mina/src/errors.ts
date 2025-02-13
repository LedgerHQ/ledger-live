import { createCustomErrorClass } from "@ledgerhq/errors";

/*
 * When the memo is greater than 32 characters
 */
export const InvalidMemoMina = createCustomErrorClass("InvalidMemoMina");

/*
 * When the user sends less than the account creation fee of 1 MINA
 */
export const AccountCreationFeeWarning = createCustomErrorClass("AccountCreationFeeWarning");
