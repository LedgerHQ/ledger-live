import { AccountIdSchema } from "@domain/entity-account";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import { initialAccountOperationsState } from "./schema";
import { mockAccountOperation } from "./schema.mock";
import {
  accountOperationsAppended,
  accountOperationsFailed,
  accountOperationsReceived,
  accountOperationsRemoved,
  accountOperationsRequested,
  accountOperationsReset,
  accountOperationsSlice,
} from "./slice";

const reducer = accountOperationsSlice.reducer;
const select = accountOperationsSlice.getSelectors();

const accountId = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const otherId = AccountIdSchema.parse("js:2:ethereum:0xdef:");

const op = (id: string, date: string, over = {}) =>
  mockAccountOperation({ id, date: DateTimeIsoSchema.parse(date), ...over });

const newest = op("op-3", "2026-01-31T12:00:00.000Z");
const middle = op("op-2", "2026-01-30T12:00:00.000Z");
const oldest = op("op-1", "2026-01-29T12:00:00.000Z");

const page = (operations = [newest, middle], over = {}) => ({
  accountId,
  operations,
  complete: false,
  sourceId: "granular",
  at: "2026-01-31T13:00:00.000Z",
  ...over,
});

describe("accountOperationsSlice", () => {
  it("starts empty", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialAccountOperationsState);
  });

  describe("accountOperationsRequested", () => {
    it("marks the account pending and keeps the source that last answered", () => {
      const loaded = reducer(undefined, accountOperationsReceived(page()));
      const next = reducer(loaded, accountOperationsRequested(accountId));
      expect(select.selectAccountOperationsStatus(next, accountId)).toEqual({
        pending: true,
        sourceId: "granular",
      });
    });
  });

  describe("accountOperationsReceived", () => {
    it("stores the window newest first, whatever order the source paged in", () => {
      const next = reducer(
        undefined,
        accountOperationsReceived(page([middle, oldest, newest], { nextCursor: "c1" })),
      );
      expect(select.selectAccountOperations(next, accountId).map(o => o.id)).toEqual([
        "op-3",
        "op-2",
        "op-1",
      ]);
      expect(select.selectHasMoreAccountOperations(next, accountId)).toBe(true);
    });

    it("replaces the window rather than merging into it", () => {
      const first = reducer(undefined, accountOperationsReceived(page([newest, middle])));
      const next = reducer(first, accountOperationsReceived(page([newest])));
      expect(select.selectAccountOperations(next, accountId).map(o => o.id)).toEqual(["op-3"]);
    });

    it("records when the head was read", () => {
      const next = reducer(undefined, accountOperationsReceived(page()));
      expect(select.selectAccountOperationsAt(next, accountId)).toBe(
        new Date("2026-01-31T13:00:00.000Z").getTime(),
      );
    });
  });

  describe("accountOperationsAppended", () => {
    it("appends an older page and keeps the order total", () => {
      const first = reducer(
        undefined,
        accountOperationsReceived(page([newest, middle], { nextCursor: "c1" })),
      );
      const next = reducer(
        first,
        accountOperationsAppended(page([oldest], { complete: true, nextCursor: undefined })),
      );
      expect(select.selectAccountOperations(next, accountId).map(o => o.id)).toEqual([
        "op-3",
        "op-2",
        "op-1",
      ]);
      expect(select.selectHasMoreAccountOperations(next, accountId)).toBe(false);
    });

    it("does not duplicate an operation repeated at a page boundary", () => {
      const first = reducer(
        undefined,
        accountOperationsReceived(page([newest, middle], { nextCursor: "c1" })),
      );
      const next = reducer(first, accountOperationsAppended(page([middle, oldest])));
      expect(select.selectAccountOperations(next, accountId)).toHaveLength(3);
    });

    it("does not duplicate an operation a source repeated inside one page", () => {
      const first = reducer(undefined, accountOperationsReceived(page([newest])));
      const next = reducer(first, accountOperationsAppended(page([middle, middle, oldest])));
      expect(select.selectAccountOperations(next, accountId)).toHaveLength(3);
    });

    it("takes the page's `at` when no head read has stamped one yet", () => {
      const next = reducer(undefined, accountOperationsAppended(page([oldest])));
      expect(select.selectAccountOperationsAt(next, accountId)).toBeDefined();
    });

    it("leaves `at` alone — reading further back says nothing about newer operations", () => {
      const first = reducer(undefined, accountOperationsReceived(page([newest])));
      const at = select.selectAccountOperationsAt(first, accountId);
      const next = reducer(
        first,
        accountOperationsAppended(page([oldest], { at: "2026-02-02T00:00:00.000Z" })),
      );
      expect(select.selectAccountOperationsAt(next, accountId)).toBe(at);
    });

    it("orders by instant, not by the string a source happened to send", () => {
      // Same moment, two encodings: `DateTimeIso` admits an offset, and `+05:30` sorts after `Z`
      // lexicographically while being three hours *earlier*.
      const early = op("op-early", "2026-01-31T06:00:00+05:30");
      const late = op("op-late", "2026-01-31T06:00:00Z");
      const next = reducer(undefined, accountOperationsReceived(page([early, late])));
      expect(select.selectAccountOperations(next, accountId).map(o => o.id)).toEqual([
        "op-late",
        "op-early",
      ]);
    });

    it("orders operations sharing an instant by id, so the order is stable across reads", () => {
      const sameTime = "2026-01-30T12:00:00.000Z";
      const a = op("op-a", sameTime);
      const b = op("op-b", sameTime);
      const first = reducer(undefined, accountOperationsReceived(page([b], { nextCursor: "c1" })));
      const next = reducer(first, accountOperationsAppended(page([a])));
      expect(select.selectAccountOperations(next, accountId).map(o => o.id)).toEqual([
        "op-a",
        "op-b",
      ]);
    });
  });

  describe("selectAccountOperationsTotal", () => {
    it("is undefined on a partial window — the count is not knowable from one page", () => {
      const next = reducer(
        undefined,
        accountOperationsReceived(page([newest], { nextCursor: "c1" })),
      );
      expect(select.selectAccountOperationsTotal(next, accountId)).toBeUndefined();
    });

    it("is the window size once the history is complete", () => {
      const next = reducer(
        undefined,
        accountOperationsReceived(page([newest, middle], { complete: true })),
      );
      expect(select.selectAccountOperationsTotal(next, accountId)).toBe(2);
    });

    it("prefers a total the source could actually report", () => {
      const next = reducer(
        undefined,
        accountOperationsReceived(page([newest], { nextCursor: "c1", total: 812 })),
      );
      expect(select.selectAccountOperationsTotal(next, accountId)).toBe(812);
    });

    it("is undefined for an account never read", () => {
      expect(
        select.selectAccountOperationsTotal(initialAccountOperationsState, accountId),
      ).toBeUndefined();
    });
  });

  describe("accountOperationsFailed", () => {
    it("records the error and leaves the loaded window in place", () => {
      const first = reducer(undefined, accountOperationsReceived(page()));
      const next = reducer(first, accountOperationsFailed({ accountId, error: "explorer down" }));
      expect(select.selectAccountOperationsStatus(next, accountId)).toEqual({
        pending: false,
        error: "explorer down",
        sourceId: "granular",
      });
      expect(select.selectAccountOperations(next, accountId)).toHaveLength(2);
    });
  });

  it("reports no timestamp rather than NaN when the persisted stamp is unreadable", () => {
    const first = reducer(undefined, accountOperationsReceived(page([newest])));
    const corrupted = {
      ...first,
      byAccount: { ...first.byAccount, [accountId]: { ...first.byAccount[accountId], at: "nope" } },
    } as typeof first;
    expect(select.selectAccountOperationsAt(corrupted, accountId)).toBeUndefined();
  });

  it("removes an account's window and status", () => {
    const first = reducer(undefined, accountOperationsReceived(page()));
    const next = reducer(first, accountOperationsRemoved([accountId]));
    expect(select.selectAccountOperations(next, accountId)).toEqual([]);
    expect(select.selectAccountOperationsStatus(next, accountId)).toEqual({ pending: false });
  });

  it("leaves other accounts alone on removal", () => {
    const first = reducer(undefined, accountOperationsReceived(page()));
    const second = reducer(
      first,
      accountOperationsReceived(
        page([op("op-other", "2026-01-29T12:00:00.000Z", { accountId: otherId })], {
          accountId: otherId,
        }),
      ),
    );
    const next = reducer(second, accountOperationsRemoved([accountId]));
    expect(select.selectAccountOperations(next, otherId)).toHaveLength(1);
  });

  it("ignores an operation the read never asked about, keeping its token accounts'", () => {
    // The fan-out means a window legitimately holds the account's own rows and its token accounts';
    // a row belonging to a different account is a source bug, not a third case.
    const token = op("op-token", "2026-01-30T12:00:00.000Z", {
      accountId: `${accountId}+ethereum%2Ferc20%2Fusd__coin`,
    });
    const stray = op("op-stray", "2026-01-31T12:00:00.000Z", { accountId: otherId });
    const next = reducer(undefined, accountOperationsReceived(page([token, stray])));
    expect(select.selectAccountOperations(next, accountId).map(o => o.id)).toEqual(["op-token"]);
  });

  it("empties the table on reset", () => {
    const first = reducer(undefined, accountOperationsReceived(page()));
    expect(reducer(first, accountOperationsReset())).toEqual(initialAccountOperationsState);
  });

  it("resolves against the app root state too", () => {
    const state = reducer(undefined, accountOperationsReceived(page()));
    expect(
      accountOperationsSlice.selectors.selectAccountOperations(
        { accountOperations: state },
        accountId,
      ),
    ).toHaveLength(2);
  });
});
