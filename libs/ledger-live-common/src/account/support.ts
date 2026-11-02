import { CurrencyNotSupported } from "../errors";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { checkAccountSupported as checkAccountDerivationSupported } from "@ledgerhq/ledger-wallet-framework/account/support";
import { isCoinModuleRegistered } from "../coin-modules/registry";
import { getAccountBridge } from "../bridge";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";

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

const NON_TRANSFERABLE_TOKEN_IDS = new Set([
  "ethereum/erc20/pooled_staked_eth",
  "ethereum/erc20/lc_staked_shared_eth_0xc4dcb059dd98b45b090da8982234c61d0b9e84f9",
  "ethereum/erc20/yield_bearing_aave_usdt_0x4d431856295413906075dd40266d83624e09c672",
  "ethereum/erc20/yield_bearing_aave_usdc_0xd2011d314acaa68e5401e7f5aec3be6d2c574dcf",
  "ethereum/erc20/yield_bearing_aave_dai_0x4ef971774c77865ff8ec35f274474cb0ed9c48fa",
  "ethereum/erc20/yield_bearing_aave_usds_0xd88714e295da03a07bcb8ad4a4dbe87fa42d75f9",
  "ethereum/erc20/yield_bearing_angle_usda_0x4b20748c3dd973f1456eccde4ff84d54792dcd3e",
]);

export const isNonTransferableToken = (currency: { id: string }): boolean =>
  NON_TRANSFERABLE_TOKEN_IDS.has(currency.id);

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
