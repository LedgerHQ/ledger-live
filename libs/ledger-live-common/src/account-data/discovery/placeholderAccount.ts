import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  emptyHistoryCache,
  encodeAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { toLegacyAccount } from "../../account/accountDescriptor";
import { toLegacyPath } from "./deriveWithLegacySigners";

/** An account the app does not hold, from its descriptor alone: what a first sync starts from. */
export function placeholderAccount(descriptor: AccountDescriptor): Account {
  const { currencyId, derivationMode, index, xpub, freshAddress } = toLegacyAccount(descriptor);
  return {
    type: "Account",
    id: encodeAccountId({
      type: "js",
      version: "2",
      currencyId,
      xpubOrAddress: xpub ?? freshAddress ?? "",
      derivationMode,
    }),
    seedIdentifier: xpub ?? freshAddress ?? "",
    derivationMode,
    index,
    xpub,
    freshAddress: freshAddress ?? "",
    freshAddressPath: descriptor.type === "address" ? toLegacyPath(descriptor.path) : "",
    used: false,
    currency: getCryptoCurrencyById(currencyId),
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
