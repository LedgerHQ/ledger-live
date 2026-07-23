import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  encodeAccountId,
  decodeAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/accountId";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import type { HederaAccount } from "@ledgerhq/coin-hedera/types";

export const HEDERA = getCryptoCurrencyById("hedera");

/**
 * Local Solo's consensus endpoint; the port can differ between Solo versions — confirm
 * against the live deploy output before running.
 */
export const LOCAL_CONSENSUS_NODES: Record<string, string> = { "127.0.0.1:35211": "0.0.3" };
export const LOCAL_MIRROR_NODE_URL = "http://127.0.0.1:38081";

export const GENESIS_ACCOUNT_ID = "0.0.2";

/**
 * Canonical genesis operator key of a local Hedera network — a public constant, not a secret.
 * Solo 0.68.0 writes exactly this value to `~/.solo/<deployment>/accounts.json`.
 */
export const GENESIS_OPERATOR_KEY =
  "302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137";

/**
 * Fake hgraph URL served only by indexer.ts's MSW handler — must resolve to something
 * since coin-hedera calls hgraph unconditionally.
 */
export const FAKE_HGRAPH_URL = "http://127.0.0.1:19999/hgraph";

/**
 * An existing Solo-funded account used only as the send recipient. Its own
 * key is irrelevant — the recipient never signs anything in this scenario.
 */
export const RECIPIENT = "0.0.1002";

/**
 * `accountId` comes from the AccountCreateTransaction receipt, never hard-coded.
 * `seedIdentifier` is the raw Ed25519 public key hex.
 */
export function makeHederaAccount(accountId: string, publicKey: string): HederaAccount {
  const id = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: HEDERA.id,
    xpubOrAddress: accountId,
    derivationMode: "hederaBip44",
  });
  const { derivationMode } = decodeAccountId(id);
  const scheme = getDerivationScheme({ derivationMode, currency: HEDERA });
  const freshAddressPath = runDerivationScheme(scheme, HEDERA, {});

  return {
    type: "Account",
    id,
    seedIdentifier: publicKey,
    derivationMode,
    index: 0,
    freshAddress: accountId,
    freshAddressPath,
    used: false,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    currency: HEDERA,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(0),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    subAccounts: [],
  };
}

export const TOKEN_DECIMALS = 2;
export const TOKEN_SYMBOL = "LLT";

/** Stubbed HBAR/USD rate. Fee estimates derive from it, so no assertion may depend on its value. */
export const HBAR_USD_RATE = 0.1;

/**
 * A `TokenCurrency` for a token minted on the local Solo network. It exists in no CAL, so the
 * tester has to describe it itself. `contractAddress` must be the mirror-node `token_id`
 * (e.g. "0.0.1234"): that is the key `buildCalTokenMap` looks the token up by.
 */
export function makeLocalHtsToken(tokenId: string): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: `hedera/hts/${tokenId}`,
    contractAddress: tokenId,
    parentCurrencyId: HEDERA.id,
    tokenType: "hts",
    name: "Ledger Live Test Token",
    ticker: TOKEN_SYMBOL,
    units: [{ name: "Ledger Live Test Token", code: TOKEN_SYMBOL, magnitude: TOKEN_DECIMALS }],
  };
}

/**
 * Installs a crypto-assets store backed by an explicit token list. HBAR-only scenarios pass `[]`,
 * which reproduces the previous "resolve nothing" stub. This is process-global: every scenario
 * installs its own, so the scenarios are isolated in account state, not in module state.
 */
export function installCryptoAssetsStore(tokens: TokenCurrency[]): void {
  const byAddress = new Map(tokens.map(t => [t.contractAddress.toLowerCase(), t]));
  const byId = new Map(tokens.map(t => [t.id, t]));

  setCryptoAssetsStore({
    findTokenById: async (id: string) => byId.get(id),
    findTokenByAddressInCurrency: async (address: string, currencyId: string) =>
      currencyId === HEDERA.id ? byAddress.get(address.toLowerCase()) : undefined,
    getTokensSyncHash: async () => "",
  });
}
