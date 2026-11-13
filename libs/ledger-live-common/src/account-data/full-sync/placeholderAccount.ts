import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { AccountDataNotServedError } from "@domain/api-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  emptyHistoryCache,
  encodeAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { addressFromKey, toLegacyAccount } from "../../account/accountDescriptor";
import { resolveFamily } from "../../bridge/zcashRouting";
import { syncsFromDescriptor } from "../../coin-modules/registry";
import { usesMockBridges } from "../../bridge/mockMode";

/** `m/44h/60h/0h/0/0` -> `44'/60'/0'/0/0`, the spelling of the legacy resolvers. */
export const toLegacyPath = (path: string) => path.replace(/^m\//, "").replaceAll("h", "'");

/** An account the store does not hold, from its descriptor; not served for a family needing more. */
export async function placeholderAccount(descriptor: AccountDescriptor): Promise<Account> {
  const { currencyId, derivationMode, index, xpub, freshAddress, publicKey } =
    toLegacyAccount(descriptor);
  const currency = getCryptoCurrencyById(currencyId);
  if (!syncsFromDescriptor(resolveFamily(currency))) {
    throw new AccountDataNotServedError(`${currencyId} cannot sync from a descriptor alone`);
  }
  // A public-key family's sync reads its key from the account id (TON, ICP, Aptos, Stacks).
  const xpubOrAddress = xpub ?? publicKey ?? freshAddress ?? "";
  const address = publicKey ? await addressFromKey(currencyId, publicKey) : (freshAddress ?? "");
  return {
    type: "Account",
    id: encodeAccountId({
      type: usesMockBridges() ? "mock" : "js",
      version: "2",
      currencyId,
      xpubOrAddress,
      derivationMode,
    }),
    seedIdentifier: xpubOrAddress,
    derivationMode,
    index,
    xpub,
    freshAddress: address,
    freshAddressPath: descriptor.type === "address" ? toLegacyPath(descriptor.path) : "",
    used: false,
    currency,
    swapHistory: [],
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(0),
    creationDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
  };
}
