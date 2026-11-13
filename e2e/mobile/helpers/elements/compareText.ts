export type ExpectTextOptions = {
  /** Any run of whitespace, non-breaking spaces included, counts as one space; zero-width spaces and edges are dropped. */
  normaliseWhitespace?: boolean;
  /** The element's text contains `text` instead of being equal to it. */
  containing?: boolean;
  /** Letter case is ignored, e.g. a checksummed EVM address against a lowercase fixture. */
  ignoreCase?: boolean;
};

/** Applies the options that change the text itself, to the actual and the expected text alike. */
const prepareText = (value: string, { normaliseWhitespace, ignoreCase }: ExpectTextOptions) => {
  const preppedValue = normaliseWhitespace
    ? value.replaceAll(/\s+/g, " ").replaceAll("\u200B", "").trim()
    : value;
  return ignoreCase ? preppedValue.toLowerCase() : preppedValue;
};

/** Compares an element's text as the options say: equal by default, or containing. */
export const compareText = (actual: string, expected: string, options: ExpectTextOptions) => {
  const preparedActual = prepareText(actual, options);
  const preparedExpected = prepareText(expected, options);
  if (options.containing) {
    jestExpect(preparedActual).toContain(preparedExpected);
  } else {
    jestExpect(preparedActual).toBe(preparedExpected);
  }
};
