import { CurrencyNotSupported } from "../errors";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { checkAccountSupported as checkAccountDerivationSupported } from "@ledgerhq/ledger-wallet-framework/account/support";
import { isCoinModuleRegistered } from "../coin-modules/registry";
import { getAccountBridge } from "../bridge";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export { getReceiveFlowError } from "@ledgerhq/ledger-wallet-framework/account/support";

// Supported = a coin module is registered for the family, plus a known derivation mode.
export function checkAccountSupported(account: Account): Error | null | undefined {
  if (!isCoinModuleRegistered(account.currency.family)) {
    return new CurrencyNotSupported(
      `No coin module registered for family "${account.currency.family}"`,
      { currencyName: account.currency.id },
    );
  }
  return checkAccountDerivationSupported(account);
}

// Send/Receive capability per family on Ledger Wallet. Defaults to both supported; only exceptions
// are listed.
type TransferCapability = { send: boolean; receive: boolean };
const DEFAULT_TRANSFER_CAPABILITY: TransferCapability = { send: true, receive: true };
const FAMILY_TRANSFER_CAPABILITY: Partial<Record<CryptoCurrency["family"], TransferCapability>> = {
  hypercore: { send: false, receive: false },
};

const transferCapability = (family: CryptoCurrency["family"]): TransferCapability =>
  FAMILY_TRANSFER_CAPABILITY[family] ?? DEFAULT_TRANSFER_CAPABILITY;

export const isSendDisabledForFamily = (family: CryptoCurrency["family"]): boolean =>
  !transferCapability(family).send;

export const isReceiveDisabledForFamily = (family: CryptoCurrency["family"]): boolean =>
  !transferCapability(family).receive;

// Send capability: the family must allow it AND the bridge must accept building a transaction.
// Total: any throw (incl. getMainAccount on a malformed account) resolves to false.
export async function canSend(
  account: AccountLike,
  parentAccount: Account | null | undefined,
): Promise<boolean> {
  try {
    const mainAccount = getMainAccount(account, parentAccount);
    if (isSendDisabledForFamily(mainAccount.currency.family)) return false;
    (await getAccountBridge(account, parentAccount)).createTransaction(mainAccount);
    return true;
  } catch {
    return false;
  }
}

// Receive capability for the account's family (no bridge probe, unlike canSend).
// Total: returns false rather than throwing if the account cannot be resolved.
export const canReceive = (
  account: AccountLike,
  parentAccount: Account | null | undefined,
): boolean => {
  try {
    return !isReceiveDisabledForFamily(getMainAccount(account, parentAccount).currency.family);
  } catch {
    return false;
  }
};
