import { fromDescriptorPath } from "@domain/entity-account-descriptor";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  emptyHistoryCache,
  encodeAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { addressFromKey, toLegacyAccount } from "../../account/accountDescriptor";
import { usesMockBridges } from "../../bridge/mockMode";

/** An account the store does not hold, from its descriptor (the mock scan's own in mock mode). */
export async function placeholderAccount(descriptor: AccountDescriptor): Promise<Account> {
  const { currencyId, derivationMode, index, xpub, freshAddress, publicKey } =
    toLegacyAccount(descriptor);
  const currency = getCryptoCurrencyById(currencyId);
  // A public-key family's sync reads its key from the account id (TON, ICP, Aptos, Stacks).
  const xpubOrAddress = xpub ?? publicKey ?? freshAddress ?? "";
  const mock = usesMockBridges();
  if (mock) {
    const { findScannedMockAccount } = await import("../../bridge/mockHelpers");
    const scanned = await findScannedMockAccount(currency, xpubOrAddress);
    if (scanned) return scanned;
  }
  const address = publicKey ? await addressFromKey(currencyId, publicKey) : (freshAddress ?? "");
  return {
    type: "Account",
    id: encodeAccountId({
      type: mock ? "mock" : "js",
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
    freshAddressPath: descriptor.type === "address" ? fromDescriptorPath(descriptor.path) : "",
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
