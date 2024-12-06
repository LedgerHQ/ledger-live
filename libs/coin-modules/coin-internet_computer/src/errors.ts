import { createCustomErrorClass } from "@ledgerhq/errors";

/*
 * When the transferID/Memo is non number
 */
export const InvalidMemoICP = createCustomErrorClass("InvalidMemoICP");
