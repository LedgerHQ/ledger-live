import { getOperationsPageSize } from "./pagination";

describe("getOperationsPageSize", () => {
  it.each([
    {
      description: "the synced account is missing from operationsPerAccountId",
      accountId: "acc-1",
      paginationConfig: { operationsPerAccountId: { "other-acc": 10 } },
    },
    {
      description: "paginationConfig is empty",
      accountId: "acc-1",
      paginationConfig: {},
    },
    {
      description: "accountId is undefined",
      accountId: undefined,
      paginationConfig: { operationsPerAccountId: { "acc-1": 10 } },
    },
    {
      description: "accountId is null",
      accountId: null,
      paginationConfig: { operationsPerAccountId: { "acc-1": 10 } },
    },
  ])("returns Infinity when $description", ({ accountId, paginationConfig }) => {
    expect(getOperationsPageSize(accountId, { paginationConfig })).toBe(Infinity);
  });

  it("uses global operations when set", () => {
    expect(
      getOperationsPageSize("acc-1", { paginationConfig: { operations: 25 } }),
    ).toBe(25);
  });

  it("uses per-account value when account id is in the map", () => {
    expect(
      getOperationsPageSize("acc-1", {
        paginationConfig: { operationsPerAccountId: { "acc-1": 42 } },
      }),
    ).toBe(42);
  });

  it("returns the max of per-account and global when both apply", () => {
    expect(
      getOperationsPageSize("acc-1", {
        paginationConfig: {
          operations: 30,
          operationsPerAccountId: { "acc-1": 50 },
        },
      }),
    ).toBe(50);

    expect(
      getOperationsPageSize("acc-1", {
        paginationConfig: {
          operations: 80,
          operationsPerAccountId: { "acc-1": 20 },
        },
      }),
    ).toBe(80);
  });

  it("does not treat global operations of 0 as a configured page size", () => {
    expect(
      getOperationsPageSize("acc-1", { paginationConfig: { operations: 0 } }),
    ).toBe(Infinity);
    expect(
      getOperationsPageSize("acc-1", {
        paginationConfig: {
          operations: 0,
          operationsPerAccountId: { "acc-1": 15 },
        },
      }),
    ).toBe(15);
  });

  it("includes per-account value of 0 in the max calculation", () => {
    expect(
      getOperationsPageSize("acc-1", {
        paginationConfig: {
          operationsPerAccountId: { "acc-1": 0 },
          operations: 10,
        },
      }),
    ).toBe(10);
  });
});
