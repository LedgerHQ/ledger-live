import { initialWalletSyncState, WalletSyncStateSchema, WSStateSchema } from "./schema";

describe("WSStateSchema", () => {
  it.each([
    { data: null, version: 0 },
    { data: {}, version: 1 },
    { data: {}, version: 1, environment: "PROD" },
    { data: {}, version: 1, environment: "STAGING" },
    { data: { accounts: [], settings: { foo: "bar" } }, version: 42 },
  ])("accepts %p", state => {
    expect(WSStateSchema.parse(state)).toEqual(state);
  });

  it.each([
    { field: "data", value: [] },
    { field: "data", value: "payload" },
    { field: "data", value: undefined },
    { field: "version", value: null },
    { field: "version", value: "1" },
    { field: "version", value: undefined },
    { field: "environment", value: "DEVELOPMENT" },
  ])("rejects $field of $value", ({ field, value }) => {
    expect(() => WSStateSchema.parse({ data: null, version: 0, [field]: value })).toThrow();
  });
});

describe("WalletSyncStateSchema", () => {
  it("accepts the initial state", () => {
    expect(WalletSyncStateSchema.parse(initialWalletSyncState)).toEqual(initialWalletSyncState);
  });

  it("accepts hydrated state", () => {
    const state = {
      walletSyncState: { data: null, version: 0, environment: "PROD" },
      isHydrated: true,
    };

    expect(WalletSyncStateSchema.parse(state)).toEqual(state);
  });

  it("rejects a state missing walletSyncState", () => {
    expect(() => WalletSyncStateSchema.parse({})).toThrow();
  });

  it("rejects an invalid hydration flag", () => {
    expect(() =>
      WalletSyncStateSchema.parse({
        walletSyncState: { data: null, version: 0 },
        isHydrated: "yes",
      }),
    ).toThrow();
  });
});
