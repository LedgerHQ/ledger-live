import BigNumber from "bignumber.js";

export const UINT32_MAX = new BigNumber(2).pow(32).minus(1);

export const validateTag = (tag: BigNumber) => {
  return (
    !tag.isNaN() && tag.isFinite() && tag.isInteger() && tag.isPositive() && tag.lte(UINT32_MAX)
  );
};

const CANTON_ADDRESS_REGEX = /^.+::\d+$/;

export function isRecipientValid(recipient: string): boolean {
  // Canton address format: at least 1 character :: at least 1 number
  return CANTON_ADDRESS_REGEX.test(recipient);
}
