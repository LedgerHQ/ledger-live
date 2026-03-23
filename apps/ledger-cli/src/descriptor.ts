import { BigNumber } from "bignumber.js";
import type { Account, DerivationMode } from "@ledgerhq/types-live";
import {
  encodeAccountId,
  decodeAccountId,
  emptyHistoryCache,
} from "@ledgerhq/live-common/account/index";
import {
  runDerivationScheme,
  getDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

export type ParsedDescriptor = {
  type: string;
  version: string;
  currencyId: string;
  xpubOrAddress: string;
  derivationMode: string;
};

/**
 * Parse a descriptor string (account ID) into its components.
 * Format: js:2:<currencyId>:<xpubOrAddress>:<derivationMode>
 */
export function parseDescriptor(descriptor: string): ParsedDescriptor {
  try {
    const decoded = decodeAccountId(descriptor);
    return {
      type: decoded.type,
      version: decoded.version,
      currencyId: decoded.currencyId,
      xpubOrAddress: decoded.xpubOrAddress,
      derivationMode: decoded.derivationMode,
    };
  } catch {
    throw new Error(
      `Invalid descriptor: "${descriptor}"\nExpected format: js:2:<currency>:<address>:<derivationMode>`,
    );
  }
}

/**
 * Build a minimal shell Account from a parsed descriptor, ready for bridge sync.
 * This does NOT sync from the blockchain — balance and operations will be empty.
 */
export function buildShellAccount(parsed: ParsedDescriptor): Account {
  const { type, version, currencyId, xpubOrAddress, derivationMode } = parsed;
  const currency = getCryptoCurrencyById(currencyId);
  const derivationModeTyped = derivationMode as DerivationMode;
  const id = encodeAccountId({ type, version, currencyId, xpubOrAddress, derivationMode: derivationModeTyped });
  const scheme = getDerivationScheme({
    derivationMode: derivationModeTyped,
    currency,
  });
  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: 0,
    node: 0,
    address: 0,
  });
  return {
    type: "Account",
    id,
    xpub: xpubOrAddress,
    seedIdentifier: xpubOrAddress,
    used: true,
    swapHistory: [],
    derivationMode: derivationModeTyped,
    currency,
    index: 0,
    freshAddress: xpubOrAddress,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
  };
}

/**
 * Format an account as a human-readable short string.
 */
export function formatDescriptorHuman(account: Account): string {
  const addr = account.freshAddress;
  const short = addr.length > 20 ? `${addr.slice(0, 10)}…${addr.slice(-8)}` : addr;
  const mode = account.derivationMode ? ` (${account.derivationMode})` : "";
  return `${account.currency.name} • ${short}${mode}`;
}

/**
 * Return the descriptor string (account ID) for an account.
 */
export function accountToDescriptor(account: Account): string {
  return account.id;
}
