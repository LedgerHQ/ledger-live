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

// --- 10-Seconds Cache Implementation ---
type CacheEntry = {
  value: boolean;
  expiresAt: number;
};

const recipientCache = new Map<string, CacheEntry>();
const TTL = 10 * 1000; // 10 seconds

const recipientIsNew = async (recipient: string): Promise<boolean> => {
  if (!isRecipientValid(recipient)) return false;

  const info = await getAccountInfo(recipient);
  return info.isNewAccount;
};

export const cachedRecipientIsNew = async (recipient: string): Promise<boolean> => {
  const now = Date.now();
  const cached = recipientCache.get(recipient);

  if (cached && now < cached.expiresAt) {
    return cached.value;
  }

  const isNew = await recipientIsNew(recipient);
  recipientCache.set(recipient, {
    value: isNew,
    expiresAt: now + TTL,
  });

  return isNew;
};
