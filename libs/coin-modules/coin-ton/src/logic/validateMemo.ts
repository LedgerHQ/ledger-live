import { MAX_COMMENT_BYTES } from "../constants";
import { TonComment } from "../types";

/**
 * Validates a TON transaction comment (memo).
 *
 * Note: While this function is named `validateMemo` for consistency across
 * coin modules, TON uses a "comment" instead.
 * The validation checks multiple fields, not only text value.
 *
 * @param comment - TON comment object containing text and encryption flag. A missing or
 *   malformed comment is reported invalid rather than throwing, so a bad transaction patch
 *   surfaces as a validation error instead of wedging the send flow.
 * @returns true if the comment is valid, false otherwise
 */
export function validateMemo(comment: TonComment | undefined): boolean {
  if (!comment) return false;
  if (comment.isEncrypted) return true;
  if (typeof comment.text !== "string") return false;

  return comment.text.length <= MAX_COMMENT_BYTES && /^[\x20-\x7F]*$/.test(comment.text);
}
