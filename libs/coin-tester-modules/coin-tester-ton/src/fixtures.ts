import BigNumber from "bignumber.js";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";
import type { TonConfig } from "@ledgerhq/coin-ton/config";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import type { Account } from "@ledgerhq/types-live";
import { INDEXER_URL } from "./indexer";
import { friendlyAddressAt, keyPairAt } from "./signer";

export const ton = getCryptoCurrencyById("ton");

const DERIVATION_MODE = "ton";

// The assertions count each account's operations, so the strategies share none.
export const ACCOUNT_INDICES: Record<BridgeStrategy, { sender: number; recipient: number }> = {
  "generic-adapter": { sender: 0, recipient: 1 },
  legacy: { sender: 2, recipient: 3 },
};

export const pathAt = (index: number): string =>
  runDerivationScheme(
    getDerivationScheme({ derivationMode: DERIVATION_MODE, currency: ton }),
    ton,
    {
      account: index,
    },
  );

// Mirrors `libs/ledger-live-common/src/families/ton/config.ts`, pointed at the local indexer.
export const scenarioCoinConfig: TonConfig = {
  status: {
    type: "active",
    features: [{ id: "blockchain_txs", status: "active" }],
  },
  name: "Gram",
  unit: { name: "GRAM", code: "GRAM", magnitude: 9 },
  infra: {
    API_TON_ENDPOINT: INDEXER_URL,
    KNOWN_JETTONS: [],
  },
};

/**
 * The generic adapter, without a BridgeApi, keys the account id on the address, which the
 * framework hands coin-ton; the legacy bridge keys it on the public key. `xpub` is the public key,
 * which `estimateFees` needs to price the deployment a wallet's first transfer carries.
 */
export const makeAccount = (index: number, strategy: BridgeStrategy): Account => {
  const address = friendlyAddressAt(pathAt(index));
  const publicKey = keyPairAt(pathAt(index)).publicKey.toString("hex");
  return {
    type: "Account",
    id: `js:2:${ton.id}:${strategy === "legacy" ? publicKey : address}:${DERIVATION_MODE}`,
    seedIdentifier: publicKey,
    xpub: publicKey,
    derivationMode: DERIVATION_MODE,
    index,
    freshAddress: address,
    freshAddressPath: pathAt(index),
    used: false,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    currency: ton,
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
};
