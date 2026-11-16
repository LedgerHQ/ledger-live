import BigNumber from "bignumber.js";
import type { IcpCurrencyConfig } from "@ledgerhq/coin-internet_computer/config";
import { type ICPAccount, NeuronsData } from "@ledgerhq/coin-internet_computer/types/index";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { NODE_URL } from "./localIcp";
import { addressAt, publicKeyAt } from "./signer";

export const icp = getCryptoCurrencyById("internet_computer");

const DERIVATION_MODE = "internet_computer";

export const E8S_PER_ICP = 100_000_000n;

export const ACCOUNT_INDICES = { sender: 0, recipient: 1 } as const;

export const pathAt = (index: number): string =>
  runDerivationScheme(
    getDerivationScheme({ derivationMode: DERIVATION_MODE, currency: icp }),
    icp,
    {
      account: index,
    },
  );

// Mirrors `libs/ledger-live-common/src/families/internet_computer/config.ts`, pointed at the local
// network.
export const localConfig: IcpCurrencyConfig = {
  status: {
    type: "active",
    features: [{ id: "blockchain_txs", status: "active" }],
  },
  name: "Internet Computer",
  unit: { name: "ICP", code: "ICP", magnitude: 8 },
  node: { url: NODE_URL },
};

/** The legacy bridge keys the account id on the public key, which `sync` reads back from it. */
export const makeAccount = (index: number): ICPAccount => {
  const path = pathAt(index);
  const publicKey = publicKeyAt(path);
  return {
    type: "Account",
    id: `js:2:${icp.id}:${publicKey}:${DERIVATION_MODE}`,
    seedIdentifier: publicKey,
    xpub: publicKey,
    derivationMode: DERIVATION_MODE,
    index,
    freshAddress: addressAt(path),
    freshAddressPath: path,
    used: false,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    currency: icp,
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
    neurons: NeuronsData.empty(),
  };
};
