import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { Account } from "@ledgerhq/types-live";

export const TEZOS = getCryptoCurrencyById("tezos");

/**
 * TzKT mock URL — intercepted by MSW so no real network call reaches this host.
 */
export const TZKT_MOCK_URL = "https://rpc.shadownet.teztnets.com";

/**
 * Bob is the second Flextesa bootstrap account used as a fund recipient in tests.
 * Address from: `docker exec tezos-sandbox oxfordbox info`
 */
export const RECIPIENT = "tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6";

/**
 * Alice is the first Flextesa bootstrap account and an active baker.
 * Used as the delegation target in the delegate scenario.
 * Address from: `docker exec tezos-sandbox oxfordbox info`
 */
export const ALICE_BAKER_ADDRESS = "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb";

export function makeAccount(address: string, derivationMode = ""): Account {
  const id = `js:2:tezos:${address}:${derivationMode}`;
  const { derivationMode: parsedDerivationMode, xpubOrAddress } = decodeAccountId(id);
  const scheme = getDerivationScheme({ derivationMode: parsedDerivationMode, currency: TEZOS });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, TEZOS, {
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
    derivationMode: parsedDerivationMode,
    currency: TEZOS,
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
