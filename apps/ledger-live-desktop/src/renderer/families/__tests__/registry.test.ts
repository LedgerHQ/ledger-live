import { importLLDCoinFamily, clearLLDCoinFamilyCache } from "../registry";
import { useLLDCoinFamily } from "../useLLDCoinFamily";
import { preloadCoinModals } from "../modals-loaders";

const good = { default: { modalsToPreload: ["MODAL_CELO_LOCK"] } };
const importGood = jest.fn(() => Promise.resolve(good));
const importBad = jest.fn(() => Promise.reject(new Error("chunk fail")));

const importPlain = jest.fn(() => Promise.resolve({ default: {} }));

jest.mock("../loaders", () => ({
  lldFamilyLoaders: [
    { family: "good", importFamily: () => importGood() },
    { family: "bad", importFamily: () => importBad() },
    { family: "plain", importFamily: () => importPlain() },
  ],
}));
jest.mock("../modals-loaders", () => ({ preloadCoinModals: jest.fn() }));

describe("importLLDCoinFamily", () => {
  // Cache persists by design — clear between tests.
  beforeEach(() => {
    jest.clearAllMocks();
    ["good", "bad", "plain", "unknown"].forEach(clearLLDCoinFamilyCache);
  });

  it("resolves unknown families to {} without loading", async () => {
    await expect(importLLDCoinFamily("unknown")).resolves.toEqual({});
    expect(importGood).not.toHaveBeenCalled();
  });

  it("loads a family once, caches the promise and warms its modals", async () => {
    const p = importLLDCoinFamily("good");
    expect(importLLDCoinFamily("good")).toBe(p);
    await expect(p).resolves.toBe(good.default);
    expect(importGood).toHaveBeenCalledTimes(1);
    expect(preloadCoinModals).toHaveBeenCalledWith(good.default.modalsToPreload);
  });

  it("does not warm modals when the family declares none", async () => {
    await expect(importLLDCoinFamily("plain")).resolves.toEqual({});
    expect(preloadCoinModals).not.toHaveBeenCalled();
  });

  it("retries a failing import, then caches the rejection (no infinite re-suspend)", async () => {
    await expect(importLLDCoinFamily("bad")).rejects.toThrow("chunk fail");
    expect(importBad).toHaveBeenCalledTimes(3); // retried internally
    // rejection stays cached — a later call doesn't re-import
    await expect(importLLDCoinFamily("bad")).rejects.toThrow("chunk fail");
    expect(importBad).toHaveBeenCalledTimes(3);
  });

  it("clearLLDCoinFamilyCache lets a previously failed family be retried", async () => {
    await expect(importLLDCoinFamily("bad")).rejects.toThrow("chunk fail");
    clearLLDCoinFamilyCache("bad");
    await expect(importLLDCoinFamily("bad")).rejects.toThrow("chunk fail");
    expect(importBad).toHaveBeenCalledTimes(6);
  });
});

describe("useLLDCoinFamily", () => {
  it("returns {} when no name is given", () => {
    expect(useLLDCoinFamily(undefined)).toEqual({});
  });
});
