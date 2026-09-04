import {
  blockLine,
  countLine,
  formatAmount,
  formatDate,
  statusLine,
} from "./AccountOperations.internals";
import type { AccountOperationsRow, ListedOperation } from "../types";

const ETH = { code: "ETH", magnitude: 18 };
const TRX = { code: "TRX", magnitude: 6 };

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

describe("formatAmount", () => {
  it("scales a smallest-unit value by the unit's magnitude", () => {
    expect(formatAmount("15336095429050782", ETH)).toBe("0.01533609 ETH");
    expect(formatAmount("1000000", TRX)).toBe("1 TRX");
  });

  it("distinguishes dust from nothing", () => {
    expect(formatAmount("1", ETH)).toBe("<0.00000001 ETH");
    expect(formatAmount("0", ETH)).toBe("0 ETH");
  });

  it("shows the raw value rather than a NaN when it cannot format", () => {
    expect(formatAmount("15336095429050782")).toBe("15336095429050782");
    expect(formatAmount("-1", ETH)).toBe("-1");
  });
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
  it("admits the total is unknown while the window is partial", () => {
    // The single most important thing this tool says: a paginated read cannot know the total, and
    // passing the loaded count off as one is exactly the lie the slice exists to avoid.
    expect(countLine(row({ operations: [operation()], total: undefined }))).toBe(
      "1 loaded · total unknown, the window is partial",
    );
  });

  it("says so once the history is complete", () => {
    expect(countLine(row({ total: 1, complete: true }))).toBe("1 loaded · complete history");
  });

  it("shows the progress when a source could report a total", () => {
    expect(countLine(row({ total: 812 }))).toBe("1 loaded of 812");
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
    // On a full sync there is no page two — the first read already returned everything.
    expect(
      statusLine(row({ status: { pending: false, sourceId: "full-sync" }, hasMore: false })),
    ).toBe("served by full-sync · nothing more to load");
  });
});
