import BigNumber from "bignumber.js";
import { fetchBalance, fetchBlockHeight, fetchTxns } from "../../api";
import { deriveAddressFromPubkey } from "../../dfinity/public-key";
import { hashTransaction } from "../../dfinity/hash";
import { getAccountShape } from "./account";

jest.mock("../../api");
jest.mock("../../dfinity/public-key");
jest.mock("../../dfinity/hash");

const mockFetchBalance = jest.mocked(fetchBalance);
const mockFetchBlockHeight = jest.mocked(fetchBlockHeight);
const mockFetchTxns = jest.mocked(fetchTxns);
const mockDeriveAddress = jest.mocked(deriveAddressFromPubkey);
const mockHashTransaction = jest.mocked(hashTransaction);

describe("getAccountShape", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockDeriveAddress.mockResolvedValue("derived-address");
    mockFetchBlockHeight.mockResolvedValue(new BigNumber(5000));
    mockFetchBalance.mockResolvedValue(new BigNumber(100000));
    mockHashTransaction.mockReturnValue("mock-hash");
  });

  it("should build account shape from public key", async () => {
    mockFetchTxns.mockResolvedValue([]);

    const result = await getAccountShape(
      {
        currency: { id: "internet_computer" },
        derivationMode: "" as any,
        rest: { publicKey: "test-pubkey" },
        derivationPath: "44'/223'/0'/0/0",
        deviceId: "",
        index: 0,
      },
      {} as any,
    );

    expect(result.balance).toEqual(new BigNumber(100000));
    expect(result.spendableBalance).toEqual(new BigNumber(100000));
    expect(result.blockHeight).toBe(5000);
    expect(result.xpub).toBe("test-pubkey");
    expect(result.operations).toEqual([]);
  });

  it("should reconciliate publicKey from initialAccount when rest.publicKey is missing", async () => {
    mockFetchTxns.mockResolvedValue([]);

    const result = await getAccountShape(
      {
        currency: { id: "internet_computer" },
        derivationMode: "" as any,
        rest: {},
        derivationPath: "44'/223'/0'/0/0",
        deviceId: "",
        index: 0,
        initialAccount: {
          id: "js:2:internet_computer:initial-pubkey:",
          operations: [],
          blockHeight: 0,
        } as any,
      },
      {} as any,
    );

    expect(result.xpub).toBe("initial-pubkey");
  });

  it("should throw when publicKey cannot be reconciliated", async () => {
    await expect(
      getAccountShape(
        {
          currency: { id: "internet_computer" },
          derivationMode: "" as any,
          rest: {},
          derivationPath: "44'/223'/0'/0/0",
          deviceId: "",
          index: 0,
        },
        {} as any,
      ),
    ).rejects.toThrow("publicKey wasn't properly restored");
  });

  it("should map outgoing transfer transactions to OUT operations", async () => {
    const txns = [
      {
        id: BigInt(100),
        transaction: {
          memo: BigInt(42),
          icrc1_memo: [],
          operation: {
            Transfer: {
              from: "derived-address",
              to: "recipient-address",
              amount: { e8s: BigInt(50000) },
              fee: { e8s: BigInt(10000) },
              spender: [],
            },
          },
          timestamp: [{ timestamp_nanos: BigInt(1700000000000000000) }],
          created_at_time: [{ timestamp_nanos: BigInt(1700000000000000000) }],
        },
      },
    ];
    mockFetchTxns.mockResolvedValue(txns as any);

    const result = await getAccountShape(
      {
        currency: { id: "internet_computer" },
        derivationMode: "" as any,
        rest: { publicKey: "test-pubkey" },
        derivationPath: "44'/223'/0'/0/0",
        deviceId: "",
        index: 0,
      },
      {} as any,
    );

    expect(result.operations!.length).toBe(1);
    expect(result.operations![0].type).toBe("OUT");
    expect(result.operations![0].value).toEqual(new BigNumber(60000)); // amount + fee
  });

  it("should map incoming transfer transactions to IN operations", async () => {
    const txns = [
      {
        id: BigInt(200),
        transaction: {
          memo: BigInt(0),
          icrc1_memo: [],
          operation: {
            Transfer: {
              from: "other-address",
              to: "derived-address",
              amount: { e8s: BigInt(50000) },
              fee: { e8s: BigInt(10000) },
              spender: [],
            },
          },
          timestamp: [{ timestamp_nanos: BigInt(1700000000000000000) }],
          created_at_time: [{ timestamp_nanos: BigInt(1700000000000000000) }],
        },
      },
    ];
    mockFetchTxns.mockResolvedValue(txns as any);

    const result = await getAccountShape(
      {
        currency: { id: "internet_computer" },
        derivationMode: "" as any,
        rest: { publicKey: "test-pubkey" },
        derivationPath: "44'/223'/0'/0/0",
        deviceId: "",
        index: 0,
      },
      {} as any,
    );

    expect(result.operations!.length).toBe(1);
    expect(result.operations![0].type).toBe("IN");
    expect(result.operations![0].value).toEqual(new BigNumber(50000)); // just amount
  });

  it("should skip transactions with undefined operation", async () => {
    const txns = [
      {
        id: BigInt(300),
        transaction: {
          memo: BigInt(0),
          icrc1_memo: [],
          operation: undefined,
          timestamp: [{ timestamp_nanos: BigInt(1700000000000000000) }],
          created_at_time: [{ timestamp_nanos: BigInt(1700000000000000000) }],
        },
      },
    ];
    mockFetchTxns.mockResolvedValue(txns as any);

    const result = await getAccountShape(
      {
        currency: { id: "internet_computer" },
        derivationMode: "" as any,
        rest: { publicKey: "test-pubkey" },
        derivationPath: "44'/223'/0'/0/0",
        deviceId: "",
        index: 0,
      },
      {} as any,
    );

    expect(result.operations).toEqual([]);
  });

  it("should handle transactions with missing timestamp", async () => {
    const txns = [
      {
        id: BigInt(400),
        transaction: {
          memo: BigInt(0),
          icrc1_memo: [],
          operation: {
            Transfer: {
              from: "derived-address",
              to: "recipient-address",
              amount: { e8s: BigInt(10000) },
              fee: { e8s: BigInt(10000) },
              spender: [],
            },
          },
          timestamp: [],
          created_at_time: [],
        },
      },
    ];
    mockFetchTxns.mockResolvedValue(txns as any);

    const result = await getAccountShape(
      {
        currency: { id: "internet_computer" },
        derivationMode: "" as any,
        rest: { publicKey: "test-pubkey" },
        derivationPath: "44'/223'/0'/0/0",
        deviceId: "",
        index: 0,
      },
      {} as any,
    );

    expect(result.operations!.length).toBe(1);
  });
});
