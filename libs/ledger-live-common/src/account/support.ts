import { CurrencyNotSupported } from "@ledgerhq/errors";
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

export async function canSend(
  account: AccountLike,
  parentAccount: Account | null | undefined,
): Promise<boolean> {
  try {
    (await getAccountBridge(account, parentAccount)).createTransaction(
      getMainAccount(account, parentAccount),
    );
    return true;
  } catch {
    return false;
  }
}

// Families with no on-chain Send/Receive on Ledger Wallet (e.g. HyperCore: no send, and a plain
// receive is misleading since deposits go through bridging rather than a normal receive address).
const FAMILIES_WITHOUT_SEND: CryptoCurrency["family"][] = ["hypercore"];
const FAMILIES_WITHOUT_RECEIVE: CryptoCurrency["family"][] = ["hypercore"];

export const isSendDisabledForFamily = (family: CryptoCurrency["family"]): boolean =>
  FAMILIES_WITHOUT_SEND.includes(family);

export const isReceiveDisabledForFamily = (family: CryptoCurrency["family"]): boolean =>
  FAMILIES_WITHOUT_RECEIVE.includes(family);
