import { removeReplaced, deduplicateOperations, ReplaceableOperation } from "../operations";

const COINBASE = "0000000000000000000000000000000000000000000000000000000000000000";

type Op = ReplaceableOperation & { id: string };
const op = (over: Partial<Op>): Op =>
  ({
    id: over.hash ?? "id",
    hash: "h",
    date: "2024-01-01T00:00:00Z",
    blockHeight: null,
    extra: { inputs: [] },
    ...over,
  }) as Op;

describe("removeReplaced", () => {
  it("keeps the confirmed tx over an unconfirmed one sharing an input", () => {
    const confirmed = op({ hash: "confirmed", blockHeight: 100, extra: { inputs: ["in1"] } });
    const unconfirmed = op({ hash: "unconfirmed", blockHeight: null, extra: { inputs: ["in1"] } });
    const res = removeReplaced([confirmed, unconfirmed]);
    expect(res.map(o => o.hash)).toEqual(["confirmed"]);
  });

  it("keeps the higher-blockHeight tx when both share an input", () => {
    const low = op({ hash: "low", blockHeight: 100, extra: { inputs: ["in1"] } });
    const high = op({ hash: "high", blockHeight: 200, extra: { inputs: ["in1"] } });
    const res = removeReplaced([low, high]);
    expect(res.map(o => o.hash)).toEqual(["high"]);
  });

  it("always keeps coinbase transactions", () => {
    const coinbase = op({ hash: "cb", blockHeight: 100, extra: { inputs: [COINBASE + ":0"] } });
    const normal = op({ hash: "n", blockHeight: 100, extra: { inputs: ["in1"] } });
    const res = removeReplaced([coinbase, normal]);
    expect(res.map(o => o.hash)).toEqual(expect.arrayContaining(["cb", "n"]));
  });

  it("always keeps operations without inputs", () => {
    const noInputs = op({ hash: "out", blockHeight: 100, extra: { inputs: [] } });
    expect(removeReplaced([noInputs]).map(o => o.hash)).toEqual(["out"]);
  });

  it("drops an unconfirmed op whose input is already spent by a confirmed tx", () => {
    const confirmed = op({ hash: "confirmed", blockHeight: 100, extra: { inputs: ["in1"] } });
    const superseded = op({
      hash: "superseded",
      blockHeight: null,
      date: new Date().toISOString(),
      extra: { inputs: ["in1"] },
    });
    const res = removeReplaced([confirmed, superseded]);
    expect(res.map(o => o.hash)).toEqual(["confirmed"]);
  });

  it("drops an expired unconfirmed tx (older than 2h)", () => {
    const stale = op({
      hash: "stale",
      blockHeight: null,
      date: "2024-01-01T00:00:00Z",
      extra: { inputs: ["in1"] },
    });
    // now = 3h after the tx date
    const now = Date.parse("2024-01-01T03:00:00Z");
    expect(removeReplaced([stale], now)).toEqual([]);
  });

  it("keeps both txs sharing an input at the same height (flag off)", () => {
    const a = op({ hash: "a", blockHeight: 100, extra: { inputs: ["in1"] } });
    const b = op({ hash: "b", blockHeight: 100, extra: { inputs: ["in1"] } });
    const res = removeReplaced([a, b]);
    expect(res.map(o => o.hash)).toEqual(expect.arrayContaining(["a", "b"]));
  });

  it("drops the not-more-recent tie at the same height when the flag is set", () => {
    const recent = op({
      hash: "recent",
      blockHeight: 100,
      date: "2024-01-02T00:00:00Z",
      extra: { inputs: ["in1"] },
    });
    const older = op({
      hash: "older",
      blockHeight: 100,
      date: "2024-01-01T00:00:00Z",
      extra: { inputs: ["in1"] },
    });
    // recent is processed first; older shares the input at the same height but is
    // not more recent ⇒ with the flag on it must be dropped, not kept alongside.
    const res = removeReplaced([recent, older], Date.parse("2024-01-02T02:00:00Z"), true);
    expect(res.map(o => o.hash)).toEqual(["recent"]);
  });

  it("prefers the most recent when heights match and the flag is set", () => {
    const older = op({
      hash: "older",
      blockHeight: 100,
      date: "2024-01-01T00:00:00Z",
      extra: { inputs: ["in1"] },
    });
    const newer = op({
      hash: "newer",
      blockHeight: 100,
      date: "2024-01-02T00:00:00Z",
      extra: { inputs: ["in1"] },
    });
    const res = removeReplaced([older, newer], Date.parse("2024-01-02T02:00:00Z"), true);
    expect(res.map(o => o.hash)).toEqual(["newer"]);
  });
});

describe("deduplicateOperations", () => {
  it("removes duplicate operations by id and drops undefined entries", () => {
    const a = op({ id: "a", hash: "a" });
    const b = op({ id: "b", hash: "b" });
    const res = deduplicateOperations([a, b, undefined, { ...a }]);
    expect(res.map(o => o.id)).toEqual(["a", "b"]);
  });
});
