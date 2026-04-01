import { BigNumber } from "bignumber.js";
import { createZcashAccountStub } from "../core/account-factory";

// Mock makeGetAccountShape to avoid real network calls in unit tests
jest.mock("@ledgerhq/coin-bitcoin/synchronisation", () => ({
  makeGetAccountShape: jest.fn(),
}));
jest.mock("@ledgerhq/coin-bitcoin/config", () => ({
  setCoinConfig: jest.fn(),
  getCoinConfig: jest.fn(),
}));

import { makeGetAccountShape } from "@ledgerhq/coin-bitcoin/synchronisation";
import { setCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { Observable } from "rxjs";
import { runZcashSync } from "../core/sync-driver";

const mockMakeGetAccountShape = makeGetAccountShape as jest.Mock;
const mockSetCoinConfig = setCoinConfig as jest.Mock;

describe("runZcashSync", () => {
  const ufvk = "uview1testkey";
  const xpub = "xpubTEST123";

  beforeEach(() => {
    mockSetCoinConfig.mockClear();
    mockMakeGetAccountShape.mockClear();
  });

  it("calls setCoinConfig before sync", async () => {
    mockMakeGetAccountShape.mockReturnValue(
      (_info: unknown, _syncConfig: unknown) =>
        new Observable(o => {
          o.next({ blockHeight: 100, operationsCount: 0 });
          o.complete();
        }),
    );

    const account = createZcashAccountStub({ ufvk, xpub, birthHeight: 0 });
    await runZcashSync({ initialAccount: account });

    expect(mockSetCoinConfig).toHaveBeenCalledTimes(1);
  });

  it("resolves with finalShape from Observable emissions", async () => {
    mockMakeGetAccountShape.mockReturnValue(
      (_info: unknown, _syncConfig: unknown) =>
        new Observable(o => {
          o.next({
            blockHeight: 200,
            balance: new BigNumber(100),
            privateInfo: {},
            operations: Array.from({ length: 5 }, (_, i) => ({ id: `op-${i}` })),
          });
          o.next({
            blockHeight: 300,
            balance: new BigNumber(200),
            privateInfo: {},
            operations: Array.from({ length: 8 }, (_, i) => ({ id: `op-${i}` })),
          });
          o.complete();
        }),
    );

    const account = createZcashAccountStub({ ufvk, xpub, birthHeight: 100 });
    const { finalShape } = await runZcashSync({ initialAccount: account });

    expect(finalShape.blockHeight).toBe(300);
    expect(finalShape.operationsCount).toBe(8);
  });

  it("stops at toHeight when specified", async () => {
    mockMakeGetAccountShape.mockReturnValue(
      (_info: unknown, _syncConfig: unknown) =>
        new Observable(o => {
          // Emit blocks one by one — privateInfo marks these as shielded updates
          // so takeWhile applies the toHeight guard (transparent updates are exempted)
          for (let h = 100; h <= 1000; h += 100) {
            o.next({ blockHeight: h, operationsCount: h / 100, privateInfo: {} });
          }
          o.complete();
        }),
    );

    const account = createZcashAccountStub({ ufvk, xpub, birthHeight: 0 });
    const { finalShape } = await runZcashSync({ initialAccount: account, toHeight: 500 });

    expect(finalShape.blockHeight ?? 0).toBeLessThanOrEqual(500);
  });

  it("calls onUpdate for each emission", async () => {
    const updates: number[] = [];
    mockMakeGetAccountShape.mockReturnValue(
      (_info: unknown, _syncConfig: unknown) =>
        new Observable(o => {
          o.next({ blockHeight: 100 });
          o.next({ blockHeight: 200 });
          o.complete();
        }),
    );

    const account = createZcashAccountStub({ ufvk, xpub, birthHeight: 0 });
    await runZcashSync({
      initialAccount: account,
      onUpdate: async shape => {
        updates.push(shape.blockHeight ?? 0);
      },
    });

    expect(updates).toEqual([100, 200]);
  });

  it("rejects when Observable errors", async () => {
    mockMakeGetAccountShape.mockReturnValue(
      (_info: unknown, _syncConfig: unknown) =>
        new Observable(o => {
          o.error(new Error("network error"));
        }),
    );

    const account = createZcashAccountStub({ ufvk, xpub, birthHeight: 0 });
    await expect(runZcashSync({ initialAccount: account })).rejects.toThrow("network error");
  });
});

describe("createZcashAccountStub", () => {
  it("creates account with privateInfo.ufvk set", () => {
    const account = createZcashAccountStub({ ufvk: "uview1test", xpub: "xpubABC" });
    expect(account.privateInfo?.ufvk).toBe("uview1test");
  });

  it("sets blockHeight from birthHeight by default", () => {
    const account = createZcashAccountStub({ ufvk: "u", xpub: "x", birthHeight: 692345 });
    expect(account.blockHeight).toBe(692345);
  });

  it("prefers explicit blockHeight over birthHeight", () => {
    const account = createZcashAccountStub({
      ufvk: "u",
      xpub: "x",
      birthHeight: 100,
      blockHeight: 800000,
    });
    expect(account.blockHeight).toBe(800000);
  });

  it("encodes xpub in account id", () => {
    const account = createZcashAccountStub({ ufvk: "u", xpub: "xpubMYKEY" });
    expect(account.id).toContain("xpubMYKEY");
  });
});
