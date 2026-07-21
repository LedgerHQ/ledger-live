// Well-formed non-negative number, e.g. "0", "5", "12.34" (fixed decimal digits are not required).
export const floatNumberRegex = /^\d+(\.\d+)?$/;

// Same, but excludes all-zero values ("0", "0.00") — use where zero can never be a legitimate
// result (e.g. a computed "max" amount), so the test fails immediately instead of relying on a
// later, less direct assertion to catch it.
export const positiveFloatNumberRegex = /^(?!0*\.?0*$)\d+(\.\d+)?$/;
