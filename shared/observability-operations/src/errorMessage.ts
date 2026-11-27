export const MAX_ERROR_MESSAGE_LENGTH = 300;
const MAX_INPUT_LENGTH = 1000;

const LEADING_PUNCTUATION = new Set("(\"'[{<");
const TRAILING_PUNCTUATION = new Set(")\"']}>.,;:!?");
const NUMBER = /^[-+]?\d+$/;
const HAS_DIGIT = /\d/;
const INNER_DOT = /\w\.\w/;
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

function splitPunctuation(token: string): [before: string, word: string, after: string] {
  let start = 0;
  while (start < token.length && LEADING_PUNCTUATION.has(token[start])) start++;
  let end = token.length;
  while (end > start && TRAILING_PUNCTUATION.has(token[end - 1])) end--;
  return [token.slice(0, start), token.slice(start, end), token.slice(end)];
}

/**
 * Replaces each word holding a digit, an inner dot, an `@`, a `/` or an unusual length by `[id]`,
 * and each number by `[n]`. Best effort: a value made only of letters is kept.
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
