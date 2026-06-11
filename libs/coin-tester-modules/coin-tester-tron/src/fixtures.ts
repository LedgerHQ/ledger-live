import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Trc10Asset, Trc20Asset } from "./tokenFixtures";

export const TRON = getCryptoCurrencyById("tron");

export const TRON_LOCAL_RPC = "http://127.0.0.1:9090";

export function makeTronAccount(address: string): Account {
  const id = `js:2:tron:${address}:`;
  const { derivationMode } = decodeAccountId(id);
  const scheme = getDerivationScheme({ derivationMode, currency: TRON });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, TRON, {
    account: index,
    node: 0,
    address: 0,
  });

  return {
    type: "Account",
    id,
    xpub: address,
    subAccounts: [],
    seedIdentifier: address,
    used: true,
    swapHistory: [],
    derivationMode,
    currency: TRON,
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
  };
}

export function makeTrc10Token(asset: Trc10Asset): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: `tron/trc10/${asset.assetId}`,
    contractAddress: asset.assetId,
    parentCurrency: TRON,
    tokenType: "trc10",
    name: asset.name,
    ticker: asset.symbol,
    delisted: false,
    disableCountervalue: false,
    units: [{ name: asset.symbol, code: asset.symbol, magnitude: asset.decimals }],
    ledgerSignature: "",
  } as TokenCurrency;
}

export function makeTrc20Token(asset: Trc20Asset): TokenCurrency {
  return {
    type: "TokenCurrency",
    id: `tron/trc20/${asset.contractAddress.toLowerCase()}`,
    contractAddress: asset.contractAddress,
    parentCurrency: TRON,
    tokenType: "trc20",
    name: asset.name,
    ticker: asset.symbol,
    delisted: false,
    disableCountervalue: false,
    units: [{ name: asset.symbol, code: asset.symbol, magnitude: asset.decimals }],
  } as TokenCurrency;
}

export function registerTronTokensInMockStore(trc10: TokenCurrency, trc20: TokenCurrency): void {
  setupMockCryptoAssetsStore({
    findTokenById: async (id: string) =>
      id === trc10.id ? trc10 : id === trc20.id ? trc20 : undefined,
    findTokenByAddressInCurrency: async (address: string, currencyId: string) => {
      if (currencyId !== "tron") return undefined;
      if (address === trc10.contractAddress) return trc10;
      if (address === trc20.contractAddress) return trc20;
      return undefined;
    },
  });
}
