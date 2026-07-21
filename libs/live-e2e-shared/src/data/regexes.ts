// Well-formed non-negative number, e.g. "0", "5", "12.34".
export const floatNumberRegex = /^\d+(\.\d+)?$/;

// Same, but excludes all-zero values, e.g. "0", "0.00".
export const positiveFloatNumberRegex = /^(?:[1-9]\d*(\.\d+)?|0+\.\d*[1-9]\d*)$/;
