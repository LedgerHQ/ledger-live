import type { ExplorerTx } from "../../network/types";
import { toOperation } from "../listOperations";
import { makeTx } from "./helpers/msw";

const ME = "bc1qme";
const ALICE = "bc1qalice";
const BOB = "bc1qbob";
const BLOCK = { hash: "cd".repeat(32), height: 900_000, time: "2026-01-02T03:04:05Z" };

const tx = (inputs: [string, number][], outputs: [string, number][], fees: number): ExplorerTx =>
  makeTx("ab".repeat(32), {
    fees: String(fees),
    block: BLOCK,
    received_at: "2026-01-02T03:00:00Z",
    inputs: inputs.map(([address, value], i) => ({
      address,
      value: String(value),
      output_index: i,
    })),
    outputs: outputs.map(([address, value], i) => ({
      address,
      value: String(value),
      output_index: i,
    })),
  });

describe("toOperation", () => {
  it("maps an incoming payment", () => {
    expect(
      toOperation(
        tx(
          [[ALICE, 10_000]],
          [
            [ME, 9_000],
            [ALICE, 800],
          ],
          200,
        ),
        ME,
      ),
    ).toEqual({
      id: "ab".repeat(32),
      type: "IN",
      senders: [ALICE],
      recipients: [ME],
      value: 9_000n,
      asset: { type: "native" },
      tx: {
        hash: "ab".repeat(32),
        block: { height: 900_000, hash: "cd".repeat(32), time: new Date(BLOCK.time) },
        fees: 200n,
        date: new Date("2026-01-02T03:00:00Z"),
        failed: false,
      },
    });
  });

  it("maps a payment with change: the value excludes the fees, which the address paid", () => {
    const operation = toOperation(
      tx(
        [[ME, 10_000]],
        [
          [BOB, 6_000],
          [ME, 3_800],
        ],
        200,
      ),
      ME,
    )!;
    expect(operation.type).toBe("OUT");
    expect(operation.value).toBe(6_000n);
    expect(operation.recipients).toEqual([BOB]);
    expect(operation.tx.fees).toBe(200n);
    expect(operation.tx.feesPayer).toBe(ME);
  });

  it("maps funds sent back to the address as a fee-only operation", () => {
    const operation = toOperation(tx([[ME, 10_000]], [[ME, 9_800]], 200), ME)!;
    expect(operation).toEqual(expect.objectContaining({ type: "FEES", value: 0n }));
    expect(operation.tx.fees).toBe(200n);
  });

  it("reports a co-funded transaction's whole fee, as the bridge does", () => {
    const operation = toOperation(
      tx(
        [
          [ME, 30_000],
          [ALICE, 10_000],
        ],
        [[BOB, 39_600]],
        400,
      ),
      ME,
    )!;
    expect(operation.type).toBe("OUT");
    expect(operation.tx.fees).toBe(400n);
    // value + fees = the 30 000 that left the address.
    expect(operation.value).toBe(29_600n);
    expect(operation.tx.feesPayer).toBeUndefined();
  });

  it("keeps the balance impact exact when a co-funder's debit is below the whole fee", () => {
    const operation = toOperation(
      tx(
        [
          [ME, 100],
          [ALICE, 50_000],
        ],
        [[BOB, 49_700]],
        400,
      ),
      ME,
    )!;
    expect(operation).toEqual(expect.objectContaining({ type: "FEES", value: 0n }));
    expect(operation.tx.fees).toBe(100n);
  });

  it("ignores unconfirmed transactions and transactions that do not move the address's funds", () => {
    expect(toOperation({ ...tx([[ALICE, 1]], [[ME, 1]], 0), block: null }, ME)).toBeUndefined();
    expect(toOperation(tx([[ALICE, 10]], [[BOB, 9]], 1), ME)).toBeUndefined();
  });
});
