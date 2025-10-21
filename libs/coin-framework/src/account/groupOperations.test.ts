import { groupAccountsOperationsByDay } from "./groupOperations";
import type { AccountLike, Operation } from "@ledgerhq/types-live";
import { createOperation, createAccount as baseCreateAccount } from "./pending.test";
import BigNumber from "bignumber.js";

// Wrapper around createOperation to set transactionSequenceNumber and optional date override
const createOp = (id: string, isoDate: string, sequence?: bigint, isPending = false): Operation => {
  const op = createOperation("acc1", ["sender"], sequence);
  const transactionSequenceNumber =
    typeof sequence === "bigint" ? new BigNumber(sequence.toString()) : undefined;
  return {
    ...op,
    id,
    hash: id,
    accountId: "acc1",
    date: new Date(isoDate),
    transactionSequenceNumber: transactionSequenceNumber,
    blockHeight: isPending ? null : 1,
  };
};

// Wrap createAccount to support injecting confirmed & pending operations
const createAccount = ({
  confirmed = [],
  pending = [],
}: {
  confirmed?: Operation[];
  pending?: Operation[];
}): AccountLike => {
  const base = baseCreateAccount("acc1");
  return {
    ...base,
    id: "acc1",
    operations: confirmed,
    operationsCount: confirmed.length,
    pendingOperations: pending,
  };
};

describe("groupAccountOperationsByDay", () => {
  it("groups confirmed ops by day and preserves order", () => {
    const op1 = createOp("op1", "2024-01-01T10:00:00Z");
    const op2 = createOp("op2", "2024-01-01T08:00:00Z");
    const op3 = createOp("op3", "2024-01-02T12:00:00Z");

    const acc = createAccount({ confirmed: [op3, op1, op2] });

    const result = groupAccountsOperationsByDay([acc], { count: 10 });

    expect(result.sections.length).toBe(2);
    expect(result.sections[0].day.toISOString()).toContain("2024-01-02");
    expect(result.sections[0].data.map((op: Operation) => op.id)).toEqual(["op3"]);
    expect(result.sections[1].data.map((op: Operation) => op.id)).toEqual(["op1", "op2"]);
  });

  it("orders ops with equal date by transactionSequenceNumber", () => {
    const op1 = createOp("op1", "2024-01-01T10:00:00Z", BigInt(3));
    const op2 = createOp("op2", "2024-01-01T10:00:00Z", BigInt(5));

    const acc1 = createAccount({ confirmed: [op1] });
    const acc2 = createAccount({ confirmed: [op2] });

    const result = groupAccountsOperationsByDay([acc1, acc2], { count: 10 });

    expect(result.sections.length).toBe(1);
    expect(result.sections[0].data.map((op: Operation) => op.id)).toEqual(["op2", "op1"]);
  });

  it("prioritizes defined transactionSequenceNumber over undefined", () => {
    const op1 = createOp("op1", "2024-01-01T10:00:00Z");
    const op2 = createOp("op2", "2024-01-01T10:00:00Z", BigInt(0));

    const acc1 = createAccount({ confirmed: [op1] });
    const acc2 = createAccount({ confirmed: [op2] });

    const result = groupAccountsOperationsByDay([acc1, acc2], { count: 10 });

    expect(result.sections[0].data.map((op: Operation) => op.id)).toEqual(["op2", "op1"]);
  });

  it("includes pending ops if not duplicated", () => {
    const confirmed = createOp("op1", "2024-01-01T10:00:00Z", BigInt(5));
    const pending = createOp("op2", "2024-01-02T10:00:00Z", BigInt(10), true);

    const acc = createAccount({
      confirmed: [confirmed],
      pending: [pending],
    });

    const result = groupAccountsOperationsByDay([acc], { count: 10 });

    expect(result.sections.length).toBe(2);
    expect(result.sections[0].data.map((op: Operation) => op.id)).toEqual(["op2"]);
    expect(result.sections[1].data.map((op: Operation) => op.id)).toEqual(["op1"]);
  });

  it("filters out pending ops with duplicate hash", () => {
    const confirmed = createOp("op1", "2024-01-01T10:00:00Z", BigInt(5));
    const pendingDuplicate = createOp("op1", "2024-01-02T10:00:00Z", BigInt(10), true); // same hash/id

    const acc = createAccount({
      confirmed: [confirmed],
      pending: [pendingDuplicate],
    });

    const result = groupAccountsOperationsByDay([acc], { count: 10 });

    expect(result.sections.length).toBe(1);
    expect(result.sections[0].data.map((op: Operation) => op.id)).toEqual(["op1"]);
  });

  it("respects filterOperation if provided", () => {
    const op1 = createOp("op1", "2024-01-01T10:00:00Z");
    const op2 = createOp("op2", "2024-01-01T09:00:00Z");

    const acc = createAccount({ confirmed: [op1, op2] });

    const result = groupAccountsOperationsByDay([acc], {
      count: 10,
      filterOperation: (op: Operation) => op.id === "op1",
    });

    expect(result.sections.length).toBe(1);
    expect(result.sections[0].data.map((op: Operation) => op.id)).toEqual(["op1"]);
  });
});
