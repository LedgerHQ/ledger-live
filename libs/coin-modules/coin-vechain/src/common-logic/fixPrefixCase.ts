const PREFIX_REGEX = /^0[xX]/;

export const fixPrefixCase = (hex: string): string => {
  return PREFIX_REGEX.test(hex) ? hex.replace(PREFIX_REGEX, "0x") : `${"0x"}${hex}`;
};
