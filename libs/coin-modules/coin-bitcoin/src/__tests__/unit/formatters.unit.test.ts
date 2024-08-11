import formatters from "../../formatters";
import { BitcoinAccount, BitcoinOutput, BitcoinResources, NetworkInfoRaw } from "../../types";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import BigNumber from "bignumber.js";

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn().mockReturnValue(3),
  changes: {
    subscribe: jest.fn(),
  },
}));
jest.mock("./wallet-btc", () => ({
  ...jest.requireActual("./wallet-btc"),
  getWalletAccount: jest.fn().mockReturnValue({
    xpub: {
      crypto: "bitcoin",
    },
  }),
}));

const networkInfo: NetworkInfoRaw = {
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

describe("formatAccountSpecifics", () => {
  const mockAccount = createFixtureAccount();

  it("should return an empty string if bitcoinResources is empty", () => {
    const result = formatters.formatAccountSpecifics({
      ...mockAccount,
    });
    expect(result).toContain("0 UTXOs");
  });

  it("should return a string with the number of UTXOs", () => {
    // getEnv.mockReturnValue(2);
    const result = formatters.formatAccountSpecifics({
      ...mockAccount,
      bitcoinResources: {
        utxos: [
          { hash: "0x3333", value: new BigNumber(1) },
          { hash: "0x4444", value: new BigNumber(3) },
        ] as BitcoinOutput[],
      },
    });
    expect(result).toContain("2 UTXOs");
  });

  it("should display all UTXOs if the number of UTXOs is less than or equal to DEBUG_UTXO_DISPLAY", () => {
    const result = formatters.formatAccountSpecifics({
      ...mockAccount,
      bitcoinResources: {
        utxos: [
          { hash: "0x3333", value: new BigNumber(1) },
          { hash: "0x4444", value: new BigNumber(3) },
        ] as BitcoinOutput[],
      },
    });
    expect(result).not.toContain("...");
  });

  it("should not display all UTXOs if the number of UTXOs is greater than DEBUG_UTXO_DISPLAY", () => {
    const account = {
      bitcoinResources: {
        utxos: [1, 2, 3, 4, 5],
      },
    };
    // getEnv.mockReturnValue(3);
    const result = formatters.formatAccountSpecifics({
      ...mockAccount,
      bitcoinResources: {
        utxos: [
          { hash: "0x1111", value: new BigNumber(1) },
          { hash: "0x2222", value: new BigNumber(2) },
          { hash: "0x3333", value: new BigNumber(3) },
          { hash: "0x4444", value: new BigNumber(4) },
          { hash: "0x5555", value: new BigNumber(5) },
        ] as BitcoinOutput[],
      },
    });
    expect(result).toContain("...");
  });
});
