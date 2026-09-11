import { blockLine, countLine, formatDate, statusLine } from "./AccountOperations.internals";
import type { AccountOperationsRow, ListedOperation } from "../types";

const ETH = { code: "ETH", magnitude: 18 };

const operation = (over: Partial<ListedOperation> = {}): ListedOperation => ({
  id: "op-1",
  type: "IN",
  value: "1000000000000000000",
  assetId: "ethereum",
  unit: ETH,
  date: "2026-01-31T12:00:00.000Z",
  blockHeight: 19_000_000,
  nested: false,
  onTokenAccount: false,
  ...over,
});

const row = (over: Partial<AccountOperationsRow> = {}): AccountOperationsRow => ({
  accountId: "js:2:ethereum:0xabc:",
  name: "My Ethereum",
  currencyId: "ethereum",
  address: "0xabc",
  granular: false,
  operations: [operation()],
  total: undefined,
  hasMore: false,
  complete: false,
  status: { pending: false },
  ...over,
});

describe("formatDate", () => {
  it("shortens an ISO instant to something a list can be scanned by", () => {
    expect(formatDate("2026-01-31T12:00:00.000Z")).toBe("2026-01-31 12:00");
  });

  it("shows an unparseable value as it is", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("blockLine", () => {
  it("names the block, or says the operation has not reached one", () => {
    expect(blockLine(operation())).toBe("block 19000000");
    expect(blockLine(operation({ blockHeight: null }))).toBe("pending");
  });
});

describe("countLine", () => {
  const read = { pending: false, sourceId: "granular" };

  it("says nothing about the window before a source has answered", () => {
    expect(countLine(row({ operations: [], status: { pending: false } }))).toBe("not read yet");
  });

  it("admits the total is unknown while the window is partial", () => {
    expect(countLine(row({ operations: [operation()], total: undefined, status: read }))).toBe(
      "1 loaded · total unknown, the window is partial",
    );
  });

  it("says so once the history is complete", () => {
    expect(countLine(row({ total: 1, complete: true, status: read }))).toBe(
      "1 loaded · complete history",
    );
  });

  it("shows the progress when a source could report a total", () => {
    expect(countLine(row({ total: 812, status: read }))).toBe("1 loaded of 812");
  });
});

describe("statusLine", () => {
  it("prefers the error over anything else", () => {
    expect(statusLine(row({ status: { pending: true, error: "boom", sourceId: "x" } }))).toBe(
      "boom",
    );
  });

  it("reports the read in flight", () => {
    expect(statusLine(row({ status: { pending: true } }))).toBe("reading…");
  });

  it("says nothing was read when no source has answered", () => {
    expect(statusLine(row())).toBe("not read yet");
  });

  it("names the source and whether a next page exists", () => {
    expect(
      statusLine(row({ status: { pending: false, sourceId: "granular" }, hasMore: true })),
    ).toBe("served by granular · more available");
    expect(
      statusLine(row({ status: { pending: false, sourceId: "full-sync" }, hasMore: false })),
    ).toBe("served by full-sync · nothing more to load");
  });
});
