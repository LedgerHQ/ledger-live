// Strong right-to-left scripts (Hebrew, Arabic, Arabic Supplement/Extended, Presentation Forms).
// Some fiat symbols are strong RTL characters, e.g. SAR "﷼", AED "د.إ.", EGP "ج.م.". When such a
// symbol is mixed with an ASCII +/- sign and Latin digits inside a single string, the Unicode
// bidirectional algorithm reorders the run and pushes the sign/symbol to the wrong side.
const RTL_PATTERN =
  /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

const LRI = "\u2066"; // LEFT-TO-RIGHT ISOLATE
const PDI = "\u2069"; // POP DIRECTIONAL ISOLATE

export const containsRTL = (str: string): boolean => RTL_PATTERN.test(str);

// Wrap a formatted amount in a left-to-right isolate so its sign, symbol and value keep their
// logical order in our LTR-forced UI. No-op for strings without RTL characters.
export const forceLTRIfRTL = (str: string): string =>
  containsRTL(str) ? `${LRI}${str}${PDI}` : str;
