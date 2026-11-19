import bs58check from "bs58check";

const ACCOUNT_ADDRESS_VERSION = 1;
const ADDRESS_BYTES = 32;

/** The leading address bytes that name the account; the rest select one of its aliases. */
const ACCOUNT_BYTES = 29;

function accountBytes(address: string): Uint8Array | undefined {
  try {
    const decoded = bs58check.decode(address);
    if (decoded.length !== 1 + ADDRESS_BYTES || decoded[0] !== ACCOUNT_ADDRESS_VERSION) {
      return undefined;
    }
    return decoded.subarray(1, 1 + ACCOUNT_BYTES);
  } catch {
    return undefined;
  }
}

/**
 * The bytes naming the account of an address, hex encoded: the same for all its
 * aliases. Undefined for anything but a valid account address.
 */
export function accountKey(address: string): string | undefined {
  const account = accountBytes(address);
  return account && Buffer.from(account).toString("hex");
}

/** Whether two addresses are aliases of one account, as the chain and the wallet proxy decide it. */
export function isSameAccount(address: string, other: string): boolean {
  if (address === other) return true;

  const account = accountBytes(address);
  const otherAccount = accountBytes(other);
  if (account === undefined || otherAccount === undefined) return false;

  return account.every((byte, index) => byte === otherAccount[index]);
}
