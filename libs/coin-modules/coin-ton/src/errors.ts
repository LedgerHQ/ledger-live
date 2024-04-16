import { createCustomErrorClass } from "@ledgerhq/errors";

/*
 * When the recipient is a new named account, and needs to be created first.
 */
export const TonCommentInvalid = createCustomErrorClass("TonCommentInvalid");
