import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { BitcoinAccount, BitcoinResources, NetworkInfoRaw } from "../../types";
import BigNumber from "bignumber.js";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";

export const networkInfo: NetworkInfoRaw = {
  family: "bitcoin",
  feeItems: {
    items: [
      {
        key: "0",
        speed: "high",
        feePerByte: "3",
      },
      {
        key: "1",
        speed: "standard",
        feePerByte: "2",
      },
      {
        key: "2",
        speed: "low",
        feePerByte: "1",
      },
    ],
    defaultFeePerByte: "1",
  },
};

export function createFixtureAccount(account?: Partial<BitcoinAccount>): BitcoinAccount {
  const currency = listCryptoCurrencies(true).find(c => c.id === "bitcoin")!;

  const bitcoinResources: BitcoinResources = account?.bitcoinResources || {
    utxos: [],
  };

  const freshAddress = {
    address: "1fMK6i7CMDES1GNGDEMX5ddDaxbkjWPw1M",
    derivationPath: "derivation_path",
  };

  return {
    type: "Account",
    id: "E0A538D5-5EE7-4E37-BB57-F373B08B8580",
    seedIdentifier: "FD5EAFE3-8C7F-4565-ADFA-2A1A2067322A",
    derivationMode: "",
    index: 0,
    freshAddress: freshAddress.address,
    freshAddressPath: freshAddress.derivationPath,
    used: true,
    balance: account?.balance || new BigNumber(0),
    spendableBalance: account?.spendableBalance || new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 100_000,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],

    bitcoinResources,
  };
}