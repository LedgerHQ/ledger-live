import BigNumber from "bignumber.js";

export const UINT32_MAX = new BigNumber(2).pow(32).minus(1);

export const validateTag = (tag: BigNumber) => {
  return (
    !tag.isNaN() && tag.isFinite() && tag.isInteger() && tag.isPositive() && tag.lte(UINT32_MAX)
  );
};

export function isRecipientValid(recipient: string): boolean {
  return recipient.length > 0;
}

export const encode = (transaction: string, signature: string, publicKey?: string) => {
  // sample encoding
  return `${transaction}${publicKey}${signature}encodedTx`;
};
