import { AccountIdSchema } from "@shared/schema-primitives";
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
      // A reorg dropped op-2; a merging refresh would keep it forever.
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

    it("leaves `at` alone — reading further back says nothing about newer operations", () => {
      const first = reducer(undefined, accountOperationsReceived(page([newest])));
      const at = select.selectAccountOperationsAt(first, accountId);
      const next = reducer(
        first,
        accountOperationsAppended(page([oldest], { at: "2026-02-02T00:00:00.000Z" })),
      );
      expect(select.selectAccountOperationsAt(next, accountId)).toBe(at);
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
      accountOperationsReceived(page([oldest], { accountId: otherId })),
    );
    const next = reducer(second, accountOperationsRemoved([accountId]));
    expect(select.selectAccountOperations(next, otherId)).toHaveLength(1);
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
