import BigNumber from "bignumber.js";

export const UINT32_MAX = new BigNumber(2).pow(32).minus(1);

export const validateTag = (tag: BigNumber) => {
  return (
    !tag.isNaN() && tag.isFinite() && tag.isInteger() && tag.isPositive() && tag.lte(UINT32_MAX)
  );
};

const CANTON_ADDRESS_REGEX = /^[a-zA-Z0-9\-_]{1,128}::[a-f0-9]{68}$/;

export function isRecipientValid(recipient: string): boolean {
  return CANTON_ADDRESS_REGEX.test(recipient);
}
