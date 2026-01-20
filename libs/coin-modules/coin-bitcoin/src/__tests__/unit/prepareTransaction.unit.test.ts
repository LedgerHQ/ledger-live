import { BigNumber } from "bignumber.js";
import { prepareTransaction, sameExcludeUTXOs } from "../../prepareTransaction";
import { createFixtureAccount, networkInfo } from "../../fixtures/common.fixtures";
import { bitcoinPickingStrategy, BitcoinAccount, Transaction } from "../../types";

jest.mock("../../getAccountNetworkInfo", () => ({
  getAccountNetworkInfo: jest.fn(),
}));

jest.mock("../../wallet-btc", () => ({
  ...jest.requireActual("../../wallet-btc"),
  getWalletAccount: jest.fn(),
}));

const getAccountNetworkInfo = jest.requireMock("../../getAccountNetworkInfo").getAccountNetworkInfo;
const getWalletAccount = jest.requireMock("../../wallet-btc").getWalletAccount;

describe("sameExcludeUTXOs", () => {
  it("returns true for identical arrays", () => {
    const a = [
      { hash: "tx1", outputIndex: 0 },
      { hash: "tx2", outputIndex: 1 },
    ];
    expect(sameExcludeUTXOs(a, a)).toBe(true);
    expect(sameExcludeUTXOs(a, [...a])).toBe(true);
  });

  it("returns true for same content in different order", () => {
    const a = [
      { hash: "tx1", outputIndex: 0 },
      { hash: "tx2", outputIndex: 1 },
    ];
    const b = [
      { hash: "tx2", outputIndex: 1 },
      { hash: "tx1", outputIndex: 0 },
    ];
    expect(sameExcludeUTXOs(a, b)).toBe(true);
  });

  it("returns true for empty arrays", () => {
    expect(sameExcludeUTXOs([], [])).toBe(true);
  });

  it("returns false when lengths differ", () => {
    const a = [{ hash: "tx1", outputIndex: 0 }];
    const b = [
      { hash: "tx1", outputIndex: 0 },
      { hash: "tx2", outputIndex: 1 },
    ];
    expect(sameExcludeUTXOs(a, b)).toBe(false);
    expect(sameExcludeUTXOs(b, a)).toBe(false);
  });

  it("returns false when same length but different content (different hash)", () => {
    const a = [
      { hash: "tx1", outputIndex: 0 },
      { hash: "tx2", outputIndex: 1 },
    ];
    const b = [
      { hash: "tx1", outputIndex: 0 },
      { hash: "tx3", outputIndex: 1 },
    ];
    expect(sameExcludeUTXOs(a, b)).toBe(false);
  });

  it("returns false when same length but different content (different outputIndex)", () => {
    const a = [
      { hash: "tx1", outputIndex: 0 },
      { hash: "tx2", outputIndex: 1 },
    ];
    const b = [
      { hash: "tx1", outputIndex: 0 },
      { hash: "tx2", outputIndex: 2 },
    ];
    expect(sameExcludeUTXOs(a, b)).toBe(false);
  });

  it("returns false when first array has duplicate and second has same total count but different set", () => {
    const a = [
      { hash: "tx1", outputIndex: 0 },
      { hash: "tx1", outputIndex: 0 },
    ];
    const b = [
      { hash: "tx1", outputIndex: 0 },
      { hash: "tx2", outputIndex: 1 },
    ];
    expect(sameExcludeUTXOs(a, b)).toBe(false);
  });

  it("returns false when second array has duplicate and first has different set", () => {
    const a = [
      { hash: "tx1", outputIndex: 0 },
      { hash: "tx2", outputIndex: 1 },
    ];
    const b = [
      { hash: "tx1", outputIndex: 0 },
      { hash: "tx1", outputIndex: 0 },
    ];
    expect(sameExcludeUTXOs(a, b)).toBe(false);
  });
});

describe("prepareTransaction", () => {
  const mockNetworkInfo = {
    ...networkInfo,
    feeItems: {
      ...networkInfo.feeItems,
      items: networkInfo.feeItems.items.map(item => ({
        ...item,
        feePerByte: new BigNumber(item.feePerByte),
      })),
      defaultFeePerByte: new BigNumber("2"),
    },
  };

  const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
    ({
      family: "bitcoin",
      amount: new BigNumber(0),
      recipient: "",
      utxoStrategy: {
        strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
        excludeUTXOs: [],
      },
      rbf: false,
      feePerByte: new BigNumber(2),
      networkInfo: mockNetworkInfo,
      ...overrides,
    }) as Transaction;

  beforeEach(() => {
    jest.clearAllMocks();
    getAccountNetworkInfo.mockResolvedValue(mockNetworkInfo);
    getWalletAccount.mockReturnValue({
      xpub: {
        explorer: {
          getTxHex: jest.fn().mockResolvedValue("00"),
        },
      },
    });
  });

  it("returns the same transaction when networkInfo, feePerByte and excludeUTXOs are unchanged", async () => {
    const account = createFixtureAccount({
      bitcoinResources: { utxos: [] },
    }) as BitcoinAccount;
    const transaction = makeTransaction({
      networkInfo: mockNetworkInfo,
      feePerByte: new BigNumber(2),
      utxoStrategy: { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: [] },
    });

    const result = await prepareTransaction(account, transaction);

    expect(result).toBe(transaction);
  });

  it("returns the same transaction when excludeUTXOs have same content (different order)", async () => {
    const account = createFixtureAccount({
      bitcoinResources: { utxos: [] },
    }) as BitcoinAccount;
    const exclusions = [
      { hash: "tx1", outputIndex: 0 },
      { hash: "tx2", outputIndex: 1 },
    ];
    const transaction = makeTransaction({
      networkInfo: mockNetworkInfo,
      feePerByte: new BigNumber(2),
      utxoStrategy: { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: exclusions },
    });

    const result = await prepareTransaction(account, transaction);

    expect(result).toBe(transaction);
  });

  it("returns a new transaction when excludeUTXOs content differs (same length)", async () => {
    const account = createFixtureAccount({
      bitcoinResources: {
        utxos: [
          {
            hash: "unfetchable",
            outputIndex: 0,
            blockHeight: null,
            address: "addr",
            value: new BigNumber(1000),
            rbf: false,
            isChange: false,
          },
        ],
      },
    }) as BitcoinAccount;
    (getWalletAccount(account).xpub.explorer.getTxHex as jest.Mock).mockRejectedValue(
      new Error("tx not found"),
    );

    const transaction = makeTransaction({
      networkInfo: mockNetworkInfo,
      feePerByte: new BigNumber(2),
      utxoStrategy: {
        strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
        excludeUTXOs: [
          { hash: "other1", outputIndex: 0 },
          { hash: "other2", outputIndex: 1 },
        ],
      },
    });

    const result = await prepareTransaction(account, transaction);

    expect(result).not.toBe(transaction);
    expect(result.utxoStrategy?.excludeUTXOs).toHaveLength(3);
    expect(result.utxoStrategy?.excludeUTXOs).toEqual(
      expect.arrayContaining([
        { hash: "other1", outputIndex: 0 },
        { hash: "other2", outputIndex: 1 },
        { hash: "unfetchable", outputIndex: 0 },
      ]),
    );
  });

  it("returns a new transaction when networkInfo was missing (fetched and applied)", async () => {
    const account = createFixtureAccount({ bitcoinResources: { utxos: [] } }) as BitcoinAccount;
    const transaction = makeTransaction({
      networkInfo: null as unknown as Transaction["networkInfo"],
      feePerByte: new BigNumber(2),
      utxoStrategy: { strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE, excludeUTXOs: [] },
    });

    const result = await prepareTransaction(account, transaction);

    expect(result).not.toBe(transaction);
    expect(result.networkInfo).toEqual(mockNetworkInfo);
  });
});
