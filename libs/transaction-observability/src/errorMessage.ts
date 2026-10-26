export const MAX_ERROR_MESSAGE_LENGTH = 300;
// Nodes sometimes echo a whole payload. Only the start of a message is worth shaping, and capping
// the input first keeps the work linear in a bounded length whatever the node sends.
const MAX_INPUT_LENGTH = 1000;

// Punctuation around a word is kept as is: "(-26)," keeps its brackets and comma.
const LEADING_PUNCTUATION = new Set("(\"'[{<");
const TRAILING_PUNCTUATION = new Set(")\"']}>.,;:!?");
const NUMBER = /^[-+]?\d+$/;
const HAS_DIGIT = /\d/;
// A dot between two word characters: `alice.near`, `vitalik.eth`, `0.0.1234`, a host name.
const INNER_DOT = /\w\.\w/;
// Longer than any word a message is made of, so only encoded data gets that far. Error codes in
// UPPER_SNAKE_CASE can be longer, and are exempt: no encoding produces one.
const MAX_WORD_LENGTH = 32;
const ERROR_CODE = /^[A-Z][A-Z_]*$/;

function shapeOf(word: string): string {
  if (NUMBER.test(word)) return "[n]";
  if (
    HAS_DIGIT.test(word) ||
    INNER_DOT.test(word) ||
    word.includes("@") ||
    word.includes("/") ||
    (word.length > MAX_WORD_LENGTH && !ERROR_CODE.test(word))
  ) {
    return "[id]";
  }
  return word;
}

/** Splits a token into its leading punctuation, its word and its trailing punctuation. */
function splitPunctuation(token: string): [string, string, string] {
  let start = 0;
  while (start < token.length && LEADING_PUNCTUATION.has(token[start])) start++;
  let end = token.length;
  while (end > start && TRAILING_PUNCTUATION.has(token[end - 1])) end--;
  return [token.slice(0, start), token.slice(start, end), token.slice(end)];
}

/**
 * Reduces an error message to its shape before it goes to a monitoring sink.
 *
 * The text of a broadcast or coin-module error comes from the node, an explorer or the coin module,
 * and often interpolates an account, an address or a transaction: `no access key found for
 * alice.near`, `evm address is missing for 0.0.1234`. Their formats differ per chain and cannot be
 * listed, so each word is judged by its shape instead: anything with a digit, an inner dot, an `@`,
 * a `/` or an unusual length is replaced, which covers addresses, account ids, hashes, amounts and
 * URLs alike. Plain words and error codes such as `ERR_INSUFFICIENT_FUNDS` survive, so the same
 * failure always yields the same message and a dashboard can group on it.
 *
 * This is best effort, not a guarantee: a value made only of letters looks like any other word and
 * is kept, such as an invalid recipient the user typed (`invalid recipient address alice`).
 */
export function sanitizeErrorMessage(message: string): string {
  const shaped = message
    .slice(0, MAX_INPUT_LENGTH)
    .split(/(\s+)/)
    .map(token => {
      if (token.trim() === "") return token;
      const [before, word, after] = splitPunctuation(token);
      return word ? `${before}${shapeOf(word)}${after}` : token;
    })
    .join("");
  return shaped.length > MAX_ERROR_MESSAGE_LENGTH
    ? `${shaped.slice(0, MAX_ERROR_MESSAGE_LENGTH)}…`
    : shaped;
}
