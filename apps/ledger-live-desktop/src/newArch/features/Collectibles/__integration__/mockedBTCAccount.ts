import { BitcoinOutput, BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BalanceHistoryCache } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

const utxos: BitcoinOutput[] = [
  {
    hash: "abc123def456",
    outputIndex: 0,
    blockHeight: 700000,
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    value: new BigNumber(5000000),
    rbf: false,
    isChange: false,
  },
  {
    hash: "def456abc123",
    outputIndex: 1,
    blockHeight: 700001,
    address: "1B2zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    value: new BigNumber(3000000),
    rbf: true,
    isChange: true,
  },
];

export const MockedbtcAccount: BitcoinAccount = {
  type: "Account",
  id: "mocked-bitcoin-account",
  seedIdentifier: "mocked-seed-identifier",
  derivationMode: "segwit",
  index: 0,
  freshAddress: "1C3zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  freshAddressPath: "44'/0'/0'/0/0",
  used: true,
  balance: new BigNumber(8000000),
  spendableBalance: new BigNumber(8000000),
  creationDate: new Date(),
  blockHeight: 700001,
  currency: {} as CryptoCurrency,
  feesCurrency: undefined,
  operationsCount: 2,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(),
  subAccounts: [],
  balanceHistoryCache: {} as BalanceHistoryCache,
  swapHistory: [],
  syncHash: undefined,
  nfts: [],
  bitcoinResources: {
    utxos,
  },
};
