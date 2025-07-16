import { BitcoinOutput, BitcoinAccount } from "@ledgerhq/coin-bitcoin/lib/types";
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
  id: "js:2:bitcoin:who_knows:native_segwit",
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
  currency: {
    type: "CryptoCurrency",
    id: "bitcoin",
    coinType: 0,
    name: "Bitcoin",
    managerAppName: "Bitcoin",
    ticker: "BTC",
    scheme: "bitcoin",
    color: "#ffae35",
    symbol: "Ƀ",
    units: [
      {
        name: "bitcoin",
        code: "BTC",
        magnitude: 8,
      },
      {
        name: "mBTC",
        code: "mBTC",
        magnitude: 5,
      },
      {
        name: "bit",
        code: "bit",
        magnitude: 2,
      },
      {
        name: "satoshi",
        code: "sat",
        magnitude: 0,
      },
    ],
    supportsSegwit: true,
    supportsNativeSegwit: true,
    family: "bitcoin",
    blockAvgTime: 900,
    bitcoinLikeInfo: {
      P2PKH: 123,
      P2SH: 125,
      XPUBVersion: 12,
    },
    explorerViews: [
      {
        address: "https://blockstream.info/address/$address",
        tx: "https://blockstream.info/tx/$hash",
      },
      {
        address: "https://www.blockchain.com/btc/address/$address",
        tx: "https://blockchain.info/btc/tx/$hash",
      },
    ],
    keywords: ["btc", "bitcoin"],
    explorerId: "btc",
  },
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
