import BigNumber from "bignumber.js";
import { setupServer } from "msw/node";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";

export const VECHAIN = getCryptoCurrencyById("vechain");

/**
 * VeChain's only in-module token, VeThor (see `coin-vechain/bridge/synchronisation.ts`, which looks
 * it up by this exact id, and `coin-vechain/logic/account/getBalance.ts`, which reports its balance
 * keyed by this contract address). Shape verified against
 * `coin-vechain/bridge/synchronisation.test.ts`'s own fixture.
 */
export const VTHO: TokenCurrency = {
  type: "TokenCurrency",
  id: "vechain/vip180/vtho",
  contractAddress: "0x0000000000000000000000000000456E65726779",
  parentCurrencyId: "vechain",
  tokenType: "vip180",
  name: "VeThor",
  ticker: "VTHO",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "VeThor", code: "VTHO", magnitude: 18 }],
};

/**
 * Registers VTHO in the crypto assets store so both strategies can resolve it into a subAccount:
 * the legacy bridge looks it up by id (`findTokenById("vechain/vip180/vtho")`), the generic-adapter
 * strategy by contract address (`findTokenByAddressInCurrency`, see
 * `live-common/families/vechain/bridge/api.ts`).
 */
export function registerVthoInMockStore(): void {
  setCryptoAssetsStore({
    findTokenById: async (id: string) => (id === VTHO.id ? VTHO : undefined),
    findTokenByAddressInCurrency: async (address: string, currencyId: string) =>
      currencyId === VECHAIN.id && address.toLowerCase() === VTHO.contractAddress.toLowerCase()
        ? VTHO
        : undefined,
    getTokensSyncHash: async () => "",
  });
}

/**
 * Single-address chain (see coin-tester-xrp / coin-tester-tron): the same `Account` shape backs
 * both the `legacy` and `generic-adapter` strategies, only the bridge implementation differs.
 */
export function makeAccount(address: string): Account {
  const id = `js:2:${VECHAIN.id}:${address}:`;
  const { derivationMode } = decodeAccountId(id);
  const scheme = getDerivationScheme({ derivationMode, currency: VECHAIN });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, VECHAIN, {
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
    currency: VECHAIN,
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

/**
 * Starts an MSW server that lets every request to the local thor-solo node through untouched and
 * fails loudly on any other (unmocked) external request — countervalues, CAL tokens/certificates,
 * etc. — so the suite stays hermetic. Returns the teardown callback.
 */
export function initMSW(): () => void {
  const server = setupServer();
  server.listen({
    onUnhandledRequest: req => {
      const hostname = new URL(req.url).hostname;
      if (["127.0.0.1", "localhost"].includes(hostname)) return;
      throw new Error(`Unhandled MSW request: ${req.method} ${req.url}`);
    },
  });
  return () => server.close();
}
