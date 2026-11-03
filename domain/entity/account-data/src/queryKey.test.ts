import { accountDataQueryKey } from "./queryKey";

describe("accountDataQueryKey", () => {
  it("keys a query whatever the order of its fields", () => {
    expect(accountDataQueryKey({ limit: 1, filter: "a" })).toBe(
      accountDataQueryKey({ filter: "a", limit: 1 }),
    );
  });

  it("keys no query, an empty one and one with unset fields alike", () => {
    expect(accountDataQueryKey(undefined)).toBe("");
    expect(accountDataQueryKey({})).toBe("");
    expect(accountDataQueryKey({ limit: undefined })).toBe("");
  });

  it("keys two different queries apart", () => {
    expect(accountDataQueryKey({ limit: 1 })).not.toBe(accountDataQueryKey({ limit: 2 }));
  });
});
