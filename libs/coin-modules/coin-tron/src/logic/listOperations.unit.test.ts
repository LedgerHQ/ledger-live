import type { Operation } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import { fetchTronAccountTxsPage, getBlock } from "../network";
import { fromTrongridTxInfoToOperation } from "../network/trongrid/trongrid-adapters";
import { TrongridTxInfo } from "../types";
import { listOperations, ListOperationsOptions } from "./listOperations";

jest.mock("../network", () => ({
  fetchTronAccountTxsPage: jest.fn(),
  getBlock: jest.fn(),
}));

jest.mock("../network/trongrid/trongrid-adapters", () => ({
  fromTrongridTxInfoToOperation: jest.fn(),
}));

describe("listOperations", () => {
  const mockAddress = "tronExampleAddress";

  const defaultOptions: ListOperationsOptions = {
    limit: 200,
    minTimestamp: 0,
    order: "asc",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getBlock as jest.Mock).mockResolvedValue({
      height: 0,
      hash: "hash0",
      time: new Date("2023-01-01T00:00:00Z"),
    });
  });

  it("should fetch transactions and return operations with pagination", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [
      {
        txID: "tx1",
        value: new BigNumber(0),
        date: new Date("2023-01-01T00:00:00Z"),
        blockHeight: 100,
      },
      {
        txID: "tx2",
        value: new BigNumber(42),
        date: new Date("2023-01-01T01:00:00Z"),
        blockHeight: 200,
      },
    ];

    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      nativeTxs: { txs: mockTxs, hasNextPage: false },
      trc20Txs: { txs: [], hasNextPage: false },
    });
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(tx => ({
      tx: { hash: tx.txID },
      value: BigInt(tx.value.toString()),
    }));

    const result = await listOperations(mockAddress, defaultOptions);

    expect(fetchTronAccountTxsPage).toHaveBeenCalledWith(
      mockAddress,
      {},
      { limit: 200, minTimestamp: 0, order: "asc" },
    );
    expect(result.items).toHaveLength(2);
    expect(result.next).toBeUndefined();
  });

  it("should handle empty transactions", async () => {
    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      nativeTxs: { txs: [], hasNextPage: false },
      trc20Txs: { txs: [], hasNextPage: false },
    });

    const result = await listOperations(mockAddress, defaultOptions);

    expect(result.items).toHaveLength(0);
    expect(result.next).toBeUndefined();
  });

  it("should return cursor when hasNextPage is true", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [
      {
        txID: "tx1",
        value: new BigNumber(0),
        date: new Date("2023-01-01T00:00:00Z"),
        blockHeight: 100,
      },
      {
        txID: "tx2",
        value: new BigNumber(42),
        date: new Date("2023-01-01T01:00:00Z"),
        blockHeight: 200,
      },
      {
        txID: "tx3",
        value: new BigNumber(50),
        date: new Date("2023-01-01T02:00:00Z"),
        blockHeight: 300,
      },
    ];

    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      nativeTxs: { txs: mockTxs, hasNextPage: true },
      trc20Txs: { txs: [], hasNextPage: false },
    });
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(tx => ({
      tx: { hash: tx.txID },
      value: BigInt(tx.value.toString()),
    }));

    const result = await listOperations(mockAddress, defaultOptions);

    expect(result.items).toHaveLength(3);
    expect(result.next).toContain("tx3");
  });

  it("should merge and dedupe native and trc20 transactions", async () => {
    const nativeTxs: Partial<TrongridTxInfo>[] = [
      {
        txID: "tx1",
        value: new BigNumber(0),
        date: new Date("2023-01-01T00:00:00Z"),
        blockHeight: 100,
      },
      {
        txID: "tx3",
        value: new BigNumber(30),
        date: new Date("2023-01-01T02:00:00Z"),
        blockHeight: 300,
      },
    ];
    const trc20Txs: Partial<TrongridTxInfo>[] = [
      {
        txID: "tx2",
        value: new BigNumber(20),
        date: new Date("2023-01-01T01:00:00Z"),
        blockHeight: 200,
      },
      {
        txID: "tx1",
        value: new BigNumber(0),
        date: new Date("2023-01-01T00:00:00Z"),
        blockHeight: 100,
      },
    ];

    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      nativeTxs: { txs: nativeTxs, hasNextPage: false },
      trc20Txs: { txs: trc20Txs, hasNextPage: false },
    });
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(tx => ({
      tx: { hash: tx.txID },
      value: BigInt(tx.value.toString()),
    }));

    const result = await listOperations(mockAddress, defaultOptions);

    expect(result.items).toHaveLength(3);
    const hashes = result.items.map(op => op.tx.hash);
    expect(hashes).toEqual(["tx1", "tx2", "tx3"]);
  });

  it("should sort transactions by timestamp in ascending order", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [
      {
        txID: "tx3",
        value: new BigNumber(30),
        date: new Date("2023-01-01T03:00:00Z"),
        blockHeight: 300,
      },
      {
        txID: "tx1",
        value: new BigNumber(10),
        date: new Date("2023-01-01T01:00:00Z"),
        blockHeight: 100,
      },
      {
        txID: "tx2",
        value: new BigNumber(20),
        date: new Date("2023-01-01T02:00:00Z"),
        blockHeight: 200,
      },
    ];

    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      nativeTxs: { txs: mockTxs, hasNextPage: false },
      trc20Txs: { txs: [], hasNextPage: false },
    });
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(tx => ({
      tx: { hash: tx.txID, date: tx.date },
      value: BigInt(tx.value.toString()),
    }));

    const result = await listOperations(mockAddress, { ...defaultOptions, order: "asc" });

    const hashes = result.items.map(op => op.tx.hash);
    expect(hashes).toEqual(["tx1", "tx2", "tx3"]);
  });

  it("should sort transactions by timestamp in descending order", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [
      {
        txID: "tx1",
        value: new BigNumber(10),
        date: new Date("2023-01-01T01:00:00Z"),
        blockHeight: 100,
      },
      {
        txID: "tx3",
        value: new BigNumber(30),
        date: new Date("2023-01-01T03:00:00Z"),
        blockHeight: 300,
      },
      {
        txID: "tx2",
        value: new BigNumber(20),
        date: new Date("2023-01-01T02:00:00Z"),
        blockHeight: 200,
      },
    ];

    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      nativeTxs: { txs: mockTxs, hasNextPage: false },
      trc20Txs: { txs: [], hasNextPage: false },
    });
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(tx => ({
      tx: { hash: tx.txID, date: tx.date },
      value: BigInt(tx.value.toString()),
    }));

    const result = await listOperations(mockAddress, { ...defaultOptions, order: "desc" });

    const hashes = result.items.map(op => op.tx.hash);
    expect(hashes).toEqual(["tx3", "tx2", "tx1"]);
  });

  it("should filter out transactions before cursor", async () => {
    const mockTxs: Partial<TrongridTxInfo>[] = [
      {
        txID: "tx1",
        value: new BigNumber(10),
        date: new Date("2023-01-01T01:00:00Z"),
        blockHeight: 100,
      },
      {
        txID: "tx2",
        value: new BigNumber(20),
        date: new Date("2023-01-01T02:00:00Z"),
        blockHeight: 200,
      },
      {
        txID: "tx3",
        value: new BigNumber(30),
        date: new Date("2023-01-01T03:00:00Z"),
        blockHeight: 300,
      },
    ];

    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      nativeTxs: { txs: mockTxs, hasNextPage: false },
      trc20Txs: { txs: [], hasNextPage: false },
    });
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(tx => ({
      tx: { hash: tx.txID },
      value: BigInt(tx.value.toString()),
    }));

    const cursorTimestamp = new Date("2023-01-01T01:00:00Z").getTime();
    const cursor = `${cursorTimestamp}:tx1`;

    const result = await listOperations(mockAddress, { ...defaultOptions, cursor });

    const hashes = result.items.map(op => op.tx.hash);
    expect(hashes).toEqual(["tx2", "tx3"]);
  });

  it("should filter by cursor position when multiple txs share same timestamp", async () => {
    const sameTimestamp = new Date("2023-01-01T01:00:00Z");
    const mockTxs: Partial<TrongridTxInfo>[] = [
      { txID: "txA", value: new BigNumber(10), date: sameTimestamp, blockHeight: 100 },
      { txID: "txB", value: new BigNumber(20), date: sameTimestamp, blockHeight: 100 },
      { txID: "txC", value: new BigNumber(30), date: sameTimestamp, blockHeight: 100 },
      {
        txID: "txD",
        value: new BigNumber(40),
        date: new Date("2023-01-01T02:00:00Z"),
        blockHeight: 200,
      },
    ];

    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      nativeTxs: { txs: mockTxs, hasNextPage: false },
      trc20Txs: { txs: [], hasNextPage: false },
    });
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(tx => ({
      tx: { hash: tx.txID },
      value: BigInt(tx.value.toString()),
    }));

    const cursor = `${sameTimestamp.getTime()}:txB`;
    const result = await listOperations(mockAddress, { ...defaultOptions, cursor });

    const hashes = result.items.map(op => op.tx.hash);
    expect(hashes).toEqual(["txC", "txD"]);
  });

  it("should handle errors from fetchTronAccountTxsPage", async () => {
    const exampleError = new Error("Network error!");
    (fetchTronAccountTxsPage as jest.Mock).mockRejectedValue(exampleError);

    await expect(listOperations(mockAddress, defaultOptions)).rejects.toThrow("Network error!");
  });

  it("should throw on invalid cursor format", async () => {
    await expect(
      listOperations(mockAddress, { ...defaultOptions, cursor: "invalid" }),
    ).rejects.toThrow("Invalid cursor format");
  });

  it("should use boundary operation for next cursor when endpoints have different last ops", async () => {
    const nativeTxs: Partial<TrongridTxInfo>[] = [
      {
        txID: "native1",
        value: new BigNumber(10),
        date: new Date("2023-01-01T01:00:00Z"),
        blockHeight: 100,
      },
      {
        txID: "native2",
        value: new BigNumber(20),
        date: new Date("2023-01-01T03:00:00Z"),
        blockHeight: 300,
      },
    ];
    const trc20Txs: Partial<TrongridTxInfo>[] = [
      {
        txID: "trc20-1",
        value: new BigNumber(15),
        date: new Date("2023-01-01T02:00:00Z"),
        blockHeight: 200,
      },
    ];

    (fetchTronAccountTxsPage as jest.Mock).mockResolvedValue({
      nativeTxs: { txs: nativeTxs, hasNextPage: true },
      trc20Txs: { txs: trc20Txs, hasNextPage: true },
    });
    (fromTrongridTxInfoToOperation as jest.Mock).mockImplementation(tx => ({
      tx: { hash: tx.txID },
      value: BigInt(tx.value.toString()),
    }));

    const result = await listOperations(mockAddress, defaultOptions);

    expect(result.next).toContain("trc20-1");
    const hashes = result.items.map(op => op.tx.hash);
    expect(hashes).toEqual(["native1", "trc20-1"]);
  });
});
