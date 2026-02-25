import BigNumber from "bignumber.js";

export const UINT32_MAX = new BigNumber(2).pow(32).minus(1);

function validateTag(tag: BigNumber) {
  return (
    !tag.isNaN() && tag.isFinite() && tag.isInteger() && tag.isPositive() && tag.lte(UINT32_MAX)
  );
}

/**
 * XRP memo is a tag. We keep the same function signature across chain to make the code
 * easier to read and have a common pattern.
 *
 * @param tag tag to validate
 * @returns true if tag is valid, otherwise false
 */
export function validateMemo(tag?: string): boolean {
  if (!tag) {
    return true;
  }

  try {
    return validateTag(new BigNumber(tag));
  } catch {
    return false;
  }
}
