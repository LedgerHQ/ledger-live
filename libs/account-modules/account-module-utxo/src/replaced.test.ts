import type { AccountOperation } from "@ledgerhq/account-module-framework";
import { anOperation } from "@ledgerhq/account-module-framework/test-utils";
import { DEFAULT_REPLACED_OPERATION_EXPIRY_MS, removeReplaced } from "./replaced";

const DATE = Date.parse("2024-01-01T00:00:00.000Z");
const op = (hash: string, height: number | null, inputs: string[], date = DATE): AccountOperation =>
  anOperation({
    id: hash,
    hash,
    block: height === null ? null : { height, hash: `b${height}`, time: new Date(date) },
    date: new Date(date),
    details: { inputs },
  });
const hashes = (ops: AccountOperation[]) => ops.map(o => o.hash);

describe("removeReplaced", () => {
  it("keeps the confirmed transaction over an unconfirmed one sharing an input", () => {
    expect(
      hashes(removeReplaced([op("c", 100, ["in1"]), op("u", null, ["in1"])], DATE, false)),
    ).toEqual(["c"]);
  });

  it("replaces an unconfirmed transaction by a confirmed one listed after it", () => {
    expect(
      hashes(removeReplaced([op("u", null, ["in1"]), op("c", 100, ["in1"])], DATE, false)),
    ).toEqual(["c"]);
  });

  it("keeps the higher block when both share an input", () => {
    expect(
      hashes(removeReplaced([op("low", 100, ["in1"]), op("high", 200, ["in1"])], DATE, false)),
    ).toEqual(["high"]);
    expect(
      hashes(removeReplaced([op("high", 200, ["in1"]), op("low", 100, ["in1"])], DATE, false)),
    ).toEqual(["high"]);
  });

  it("always keeps operations spending nothing", () => {
    expect(hashes(removeReplaced([op("in", 100, [])], DATE, false))).toEqual(["in"]);
  });

  it("drops an unconfirmed operation whose other input a confirmed one already spends", () => {
    const confirmed = op("c", 100, ["in1"]);
    const superseded = op("s", null, ["in2", "in1"]);
    expect(hashes(removeReplaced([confirmed, superseded], DATE, false))).toEqual(["c"]);
  });

  it("drops unconfirmed operations past the expiry, two hours by default", () => {
    const pending = op("p", null, ["in1"]);
    expect(DEFAULT_REPLACED_OPERATION_EXPIRY_MS).toBe(2 * 3600_000);
    expect(removeReplaced([pending], DATE + 3 * 3600_000, false)).toEqual([]);
    expect(removeReplaced([pending], DATE + 1800_000, false)).toHaveLength(1);
    expect(removeReplaced([pending], DATE + 1800_000, false, 600_000)).toEqual([]);
  });

  it("keeps both operations sharing an input at the same height", () => {
    expect(
      hashes(removeReplaced([op("a", 100, ["in1"]), op("b", 100, ["in1"])], DATE, false)),
    ).toEqual(["a", "b"]);
  });

  it("keeps only the most recent at the same height when asked", () => {
    const older = op("older", 100, ["in1"], DATE);
    const newer = op("newer", 100, ["in1"], DATE + 1000);
    expect(hashes(removeReplaced([older, newer], DATE, true))).toEqual(["newer"]);
    expect(hashes(removeReplaced([newer, older], DATE, true))).toEqual(["newer"]);
  });
});
