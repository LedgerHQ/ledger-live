import BigNumber from "bignumber.js";
import { isValidClassicAddress } from "ripple-address-codec";
import { getAccountInfo } from "../network";

export const UINT32_MAX = new BigNumber(2).pow(32).minus(1);

/** @see https://xrpl.org/basic-data-types.html#specifying-time */
export const RIPPLE_EPOCH = 946684800;

export const validateTag = (tag: BigNumber) => {
  return (
    !tag.isNaN() && tag.isFinite() && tag.isInteger() && tag.isPositive() && tag.lte(UINT32_MAX)
  );
};

export const getNextValidSequence = async (address: string) => {
  const accInfo = await getAccountInfo(address, true);
  return accInfo.sequence;
};

function isRecipientValid(recipient: string): boolean {
  return isValidClassicAddress(recipient);
}

const recipientIsNew = async (recipient: string): Promise<boolean> => {
  if (!isRecipientValid(recipient)) return false;

  const info = await getAccountInfo(recipient);
  return info.isNewAccount;
};

const cacheRecipientsNew: Record<string, boolean> = {};
export const cachedRecipientIsNew = async (recipient: string) => {
  if (recipient in cacheRecipientsNew) return cacheRecipientsNew[recipient];
  cacheRecipientsNew[recipient] = await recipientIsNew(recipient);
  return cacheRecipientsNew[recipient];
};
export const removeCachedRecipientIsNew = (recipient: string) => {
  delete cacheRecipientsNew[recipient];
};
