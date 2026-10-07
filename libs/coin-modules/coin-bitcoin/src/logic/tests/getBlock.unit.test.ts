import type {
  BlockTransaction,
  TransferBlockOperation,
} from "@ledgerhq/coin-module-framework/api/types";
import { fetchBlock, fetchBlockTxs } from "../../network/explorer";
import { getBlock, toBlockTransaction } from "../getBlock";
import { makeBlock, makeTx, testContext } from "./helpers/msw";

jest.mock("../../network/explorer");

const A = "addrA";
const B = "addrB";
const C = "addrC";

const amounts = (tx: BlockTransaction) =>
  Object.fromEntries(
    (tx.operations as TransferBlockOperation[]).map(op => [op.address, op.amount]),
  );
const sum = (tx: BlockTransaction) =>
  (tx.operations as TransferBlockOperation[]).reduce((total, op) => total + op.amount, 0n);

describe("toBlockTransaction", () => {
  it("debits a single sender by what it sent to others, excluding the fee", () => {
    const tx = toBlockTransaction(
      makeTx("01".repeat(32), {
        fees: "1000",
        inputs: [{ output_hash: "aa".repeat(32), output_index: 0, value: "50000", address: A }],
        outputs: [
          { output_index: 0, value: "30000", address: B },
          { output_index: 1, value: "19000", address: A },
        ],
      }),
    );
    expect(amounts(tx)).toEqual({ [A]: -30000n, [B]: 30000n });
    expect(tx.fees).toBe(1000n);
    // Fees are excluded from the amounts: they balance out, and the payer's balance change
    // (19000 - 50000) is its amount minus the fees.
    expect(sum(tx)).toBe(0n);
    expect(amounts(tx)[A] - tx.fees).toBe(19000n - 50000n);
    expect(tx.feesPayer).toBe(A);
    expect(tx.failed).toBe(false);
    expect(tx.operations.every(op => op.type === "transfer")).toBe(true);
  });

  it("splits the fee across two senders by input total, remainder to the largest input", () => {
    // fees 100 over inputs 2 (A) and 1 (B): floor shares 66 and 33, remainder 1 to A.
    const tx = toBlockTransaction(
      makeTx("02".repeat(32), {
        fees: "100",
        inputs: [
          { output_hash: "aa".repeat(32), output_index: 0, value: "2000", address: A },
          { output_hash: "bb".repeat(32), output_index: 0, value: "1000", address: B },
        ],
        outputs: [{ output_index: 0, value: "2900", address: C }],
      }),
    );
    expect(amounts(tx)).toEqual({ [A]: -2000n + 67n, [B]: -1000n + 33n, [C]: 2900n });
    expect(sum(tx)).toBe(0n);
    expect(tx).not.toHaveProperty("feesPayer");
  });

  it("merges several inputs of the same address", () => {
    const tx = toBlockTransaction(
      makeTx("03".repeat(32), {
        fees: "10",
        inputs: [
          { output_hash: "aa".repeat(32), output_index: 0, value: "60", address: A },
          { output_hash: "aa".repeat(32), output_index: 1, value: "40", address: A },
        ],
        outputs: [{ output_index: 0, value: "90", address: B }],
      }),
    );
    expect(amounts(tx)).toEqual({ [A]: -90n, [B]: 90n });
    expect(tx.feesPayer).toBe(A);
  });

  it("maps a coinbase with zero fees and credits only", () => {
    const tx = toBlockTransaction(
      makeTx("04".repeat(32), {
        fees: "0",
        inputs: [{ coinbase: "04ffff001d026f03" }],
        outputs: [{ output_index: 0, value: "5000000000", address: A }],
      }),
    );
    expect(tx.fees).toBe(0n);
    expect(amounts(tx)).toEqual({ [A]: 5000000000n });
    expect(tx).not.toHaveProperty("feesPayer");
  });

  it("produces no operation for an output without an address", () => {
    const tx = toBlockTransaction(
      makeTx("05".repeat(32), {
        fees: "100",
        inputs: [{ output_hash: "aa".repeat(32), output_index: 0, value: "1000", address: A }],
        outputs: [
          { output_index: 0, value: "0", address: null },
          { output_index: 1, value: "900", address: B },
        ],
      }),
    );
    expect(tx.operations.map(op => (op as TransferBlockOperation).address)).toEqual([A, B]);
    expect(sum(tx)).toBe(0n);
  });

  it("omits an address whose net amount is zero", () => {
    const tx = toBlockTransaction(
      makeTx("06".repeat(32), {
        fees: "0",
        inputs: [{ output_hash: "aa".repeat(32), output_index: 0, value: "100", address: A }],
        outputs: [{ output_index: 0, value: "100", address: A }],
      }),
    );
    expect(tx.operations).toEqual([]);
  });
});

describe("getBlock", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("combines the block info and every transaction of the block", async () => {
    jest.mocked(fetchBlock).mockImplementation(async (_c, _id, height) => makeBlock(height));
    jest
      .mocked(fetchBlockTxs)
      .mockImplementation(async () => [makeTx("07".repeat(32)), makeTx("08".repeat(32))]);
    const block = await getBlock(testContext(), "bitcoin", 42);
    expect(block.info.height).toBe(42);
    expect(block.transactions.map(tx => tx.hash)).toEqual(["07".repeat(32), "08".repeat(32)]);
  });
});
