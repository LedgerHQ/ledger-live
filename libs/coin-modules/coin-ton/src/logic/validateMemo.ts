import { MAX_COMMENT_BYTES } from "../constants";
import { TonComment } from "../types";

/**
 * Validates a TON transaction comment (memo).
 *
 * Note: While this function is named `validateMemo` for consistency across
 * coin modules, TON uses a "comment" instead.
 * The validation checks multiple fields, not only text value.
 *
 * @param comment - TON comment object containing text and encryption flag
 * @returns true if the comment is valid, false otherwise
 */
export function validateMemo(comment: TonComment): boolean {
  return (
    comment.isEncrypted ||
    (comment.text.length <= MAX_COMMENT_BYTES && /^[\x20-\x7F]*$/.test(comment.text))
  );
}
