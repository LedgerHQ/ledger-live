import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { Account } from "@ledgerhq/types-live";

export const FILECOIN = getCryptoCurrencyById("filecoin");

/**
 * Mock API endpoint — intercepted by MSW so no real network call is made.
 * Must match the value passed to coinConfig.setCoinConfig in helpers.ts.
 */
export const FILECOIN_API_ENDPOINT = "https://mock-filecoin-api.example.com";

/**
 * A static f1 recipient address used as the fund recipient in test transactions.
 * This is a valid secp256k1 Filecoin address that does not need to be funded.
 */
export const RECIPIENT = "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za";

export function makeAccount(address: string): Account {
  const id = `js:2:filecoin:${address}:`;
  const { derivationMode, xpubOrAddress } = decodeAccountId(id);
  const scheme = getDerivationScheme({ derivationMode, currency: FILECOIN });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, FILECOIN, {
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
    currency: FILECOIN,
    index,
    nfts: [],
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
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
  };
}
