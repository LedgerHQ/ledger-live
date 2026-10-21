export const MAX_ERROR_MESSAGE_LENGTH = 300;

// Punctuation around a word is kept as is: "(-26)," keeps its brackets and comma.
const SURROUNDING_PUNCTUATION = /^([("'[{<]*)(.*?)([)"'\]}>.,;:!?]*)$/;
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

/**
 * Reduces an error message to its shape before it goes to a monitoring sink.
 *
 * The text of a broadcast or coin-module error comes from the node, an explorer or the coin module,
 * and often interpolates an account, an address or a transaction: `no access key found for
 * alice.near`, `evm address is missing for 0.0.1234`. Their formats differ per chain and cannot be
 * listed, so each word is judged by its shape instead: anything with a digit, an inner dot, an `@`,
 * a `/` or an unusual length is replaced, which covers addresses, account ids, names, hashes,
 * amounts and URLs alike. Plain words and error codes such as `ERR_INSUFFICIENT_FUNDS` survive, so
 * the same failure always yields the same message and a dashboard can group on it.
 */
export function sanitizeErrorMessage(message: string): string {
  const shaped = message
    .split(/(\s+)/)
    .map(token => {
      if (/^\s*$/.test(token)) return token;
      const [, before = "", word = "", after = ""] = SURROUNDING_PUNCTUATION.exec(token) ?? [];
      return word ? `${before}${shapeOf(word)}${after}` : token;
    })
    .join("");
  return shaped.length > MAX_ERROR_MESSAGE_LENGTH
    ? `${shaped.slice(0, MAX_ERROR_MESSAGE_LENGTH)}…`
    : shaped;
}
