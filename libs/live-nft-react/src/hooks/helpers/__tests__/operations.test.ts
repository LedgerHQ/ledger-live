import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { compareOps, parseAccountOperations } from "../operations";

const createOperation = (overrides: Partial<Operation> = {}): Operation => ({
  id: "default-id",
  hash: "default-hash",
  type: "IN",
  value: new BigNumber(100),
  fee: new BigNumber(1),
  senders: ["default-sender"],
  recipients: ["default-recipient"],
  blockHeight: null,
  blockHash: null,
  accountId: "default-account",
  date: new Date("2023-01-01"),
  extra: {},
  ...overrides,
});

describe("compareOps", () => {
  it("should return a positive number when op1 date is earlier than op2 date", () => {
    const op1 = createOperation({ date: new Date("2023-01-01") });
    const op2 = createOperation({ date: new Date("2023-01-02") });
    expect(compareOps(op1, op2)).toBeGreaterThan(0);
  });

  it("should return a negative number when op1 date is later than op2 date", () => {
    const op1 = createOperation({ date: new Date("2023-01-02") });
    const op2 = createOperation({ date: new Date("2023-01-01") });
    expect(compareOps(op1, op2)).toBeLessThan(0);
  });

  it("should return 0 when both dates are the same and transactionSequenceNumber is undefined", () => {
    const op1 = createOperation({ date: new Date("2023-01-01") });
    const op2 = createOperation({ date: new Date("2023-01-01") });
    expect(compareOps(op1, op2)).toBe(0);
  });

  it("should return 0 when op1 and op2 have the same date but op1 transactionSequenceNumber is less than op2", () => {
    const op1 = createOperation({ date: new Date("2023-01-01"), transactionSequenceNumber: 1 });
    const op2 = createOperation({ date: new Date("2023-01-01"), transactionSequenceNumber: 2 });
    expect(compareOps(op1, op2)).toBeGreaterThan(0);
  });

  it("should return a negative number when op1 and op2 have the same date but op1 transactionSequenceNumber is greater than op2", () => {
    const op1 = createOperation({ date: new Date("2023-01-01"), transactionSequenceNumber: 2 });
    const op2 = createOperation({ date: new Date("2023-01-01"), transactionSequenceNumber: 1 });
    expect(compareOps(op1, op2)).toBeLessThan(0);
  });

  it("should return 0 when both dates and transactionSequenceNumbers are the same", () => {
    const op1 = createOperation({ date: new Date("2023-01-01"), transactionSequenceNumber: 1 });
    const op2 = createOperation({ date: new Date("2023-01-01"), transactionSequenceNumber: 1 });
    expect(compareOps(op1, op2)).toBe(0);
  });

  it("should return 0 when both dates are the same and one transactionSequenceNumber is undefined", () => {
    const op1 = createOperation({ date: new Date("2023-01-01"), transactionSequenceNumber: 1 });
    const op2 = createOperation({ date: new Date("2023-01-01") });
    expect(compareOps(op1, op2)).toBe(0);
  });
});

describe("parseAccountOperations", () => {
  it("should return an empty array when operations is undefined", () => {
    expect(parseAccountOperations(undefined)).toEqual([]);
  });

  it("should return an empty array when operations is an empty array", () => {
    expect(parseAccountOperations([])).toEqual([]);
  });

  it("should flatten operations with internals and NFTs", () => {
    const op1 = createOperation({ id: "1" });
    const op2 = createOperation({ id: "2", internalOperations: [createOperation({ id: "2.1" })] });
    const op3 = createOperation({ id: "3", nftOperations: [createOperation({ id: "3.1" })] });

    const result = parseAccountOperations([op1, op2, op3]);
    expect(result).toHaveLength(5);
    expect(result.map(op => op.id)).toEqual(["1", "2", "2.1", "3", "3.1"]);
  });

  it("should filter out empty operations", () => {
    const op1 = createOperation({ id: "1" });
    const op2 = createOperation({ id: "2", internalOperations: [] });
    const op3 = createOperation({ id: "3", nftOperations: [] });

    const result = parseAccountOperations([op1, op2, op3]);
    expect(result).toHaveLength(3);
    expect(result.map(op => op.id)).toEqual(["1", "2", "3"]);
  });

  it("should sort operations by date and transactionSequenceNumber", () => {
    const op1 = createOperation({
      id: "1",
      date: new Date("2023-01-01"),
      transactionSequenceNumber: 2,
    });
    const op2 = createOperation({
      id: "2",
      date: new Date("2023-01-01"),
      transactionSequenceNumber: 1,
    });
    const op3 = createOperation({ id: "3", date: new Date("2023-01-02") });

    const result = parseAccountOperations([op1, op2, op3]);
    expect(result.map(op => op.id)).toEqual(["3", "1", "2"]);
  });

  it("should add an order property to each operation", () => {
    const op1 = createOperation({ id: "1", date: new Date("2023-01-01") });
    const op2 = createOperation({ id: "2", date: new Date("2023-01-02") });

    const result = parseAccountOperations([op1, op2]);
    expect(result[0].order).toBe(0);
    expect(result[1].order).toBe(1);
    expect(result[0].id).toBe("2");
    expect(result[1].id).toBe("1");
  });
});
