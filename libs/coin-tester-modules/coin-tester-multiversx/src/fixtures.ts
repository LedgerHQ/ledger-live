import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { MultiversXAccount } from "@ledgerhq/coin-multiversx/types";

export const ELROND = getCryptoCurrencyById("elrond");

/**
 * Aggregator API hosts the coin module calls by default (see libs/env defaults).
 * The indexer (MSW) intercepts these and proxies onto the local chain simulator,
 * so no real network request ever leaves the machine.
 */
export const MULTIVERSX_API_URL = "https://elrond.coin.ledger.com";
export const MULTIVERSX_DELEGATION_API_URL = "https://delegations-elrond.coin.ledger.com";

/**
 * Recipient for the send scenarios. A real, valid mainnet bech32 address
 * (erd1..., 62 chars). On the local simulator it starts empty and simply
 * receives the transferred funds.
 */
export const RECIPIENT = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

/** Initial EGLD funding for the scenario account: 100 EGLD (18 decimals). */
export const INITIAL_EGLD_FUNDING = "100000000000000000000";

/**
 * ESDT tokens are issued at runtime (the on-chain identifier carries a protocol-assigned
 * random suffix), so the token currency isn't known until `setup()`. The mock crypto-assets
 * store resolves against this registry, populated via `registerEsdtToken`.
 */
const esdtTokens = new Map<string, TokenCurrency>();

/** Build the TokenCurrency for an issued ESDT. id's 3rd segment is hex(identifier). */
export function makeEsdtToken(identifier: string, decimals: number): TokenCurrency {
  const ticker = identifier.split("-")[0];
  return {
    type: "TokenCurrency",
    id: `elrond/esdt/${Buffer.from(identifier).toString("hex")}`,
    contractAddress: identifier,
    parentCurrencyId: ELROND.id,
    tokenType: "esdt",
    name: ticker,
    ticker,
    delisted: false,
    disableCountervalue: false,
    units: [{ name: ticker, code: ticker, magnitude: decimals }],
  } as TokenCurrency;
}

/** Make an issued token resolvable by the bridges (by identifier and by token id). */
export function registerEsdtToken(token: TokenCurrency): void {
  esdtTokens.set(token.contractAddress, token);
  esdtTokens.set(token.id, token);
}

// Resolve the ESDT identifier -> TokenCurrency the way both bridges expect.
// The legacy path passes the identifier as `tokenIdentifier` (3rd arg); the generic
// coin framework passes it as `address` (1st arg, the asset reference).
setupMockCryptoAssetsStore({
  findTokenByAddressInCurrency: async (
    address: string,
    currencyId: string,
    tokenIdentifier?: string,
  ) => {
    if (currencyId !== ELROND.id) return undefined;
    return esdtTokens.get(tokenIdentifier ?? address);
  },
  findTokenById: async (id: string) => esdtTokens.get(id),
});

export function makeAccount(address: string): MultiversXAccount {
  const id = `js:2:elrond:${address}:`;
  const { derivationMode, xpubOrAddress } = decodeAccountId(id);
  const scheme = getDerivationScheme({ derivationMode, currency: ELROND });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, ELROND, {
    account: index,
    node: 0,
    address: 0,
  });

  return {
    type: "Account",
    id,
    xpub: xpubOrAddress,
    subAccounts: [],
    seedIdentifier: xpubOrAddress,
    used: true,
    swapHistory: [],
    derivationMode,
    currency: ELROND,
    index,
    nfts: [],
    freshAddress: address,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    multiversxResources: {
      nonce: 0,
      delegations: [],
      isGuarded: false,
    },
  };
}
