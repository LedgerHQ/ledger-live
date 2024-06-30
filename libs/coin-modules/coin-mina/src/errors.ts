import { createCustomErrorClass } from "@ledgerhq/errors";

/*
 * When the memo is greater than 32 characters
 */
export const InvalidMemoMina = createCustomErrorClass("InvalidMemoMina");
