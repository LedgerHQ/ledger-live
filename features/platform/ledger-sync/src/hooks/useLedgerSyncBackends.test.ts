/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": [""]}
 */
import { renderLedgerSyncHook } from "../__tests__/harness";
import { ledgerSyncBackendsExtra } from "../logic/backends";
import { useLedgerSyncBackends } from "./useLedgerSyncBackends";

const BACKENDS = {
  keyRingApiBaseUrl: "https://trustchain.test",
  cloudSyncApiBaseUrl: "https://cloudsync.test",
};

describe("useLedgerSyncBackends", () => {
  it("should return the backends of the thunk extra argument", () => {
    const { result } = renderLedgerSyncHook(() => useLedgerSyncBackends(), {
      extraArgument: { other: "service", ...ledgerSyncBackendsExtra(BACKENDS) },
    });

    expect(result.current).toEqual(BACKENDS);
  });

  it("should return the same backends on every render", () => {
    const { result, rerender } = renderLedgerSyncHook(() => useLedgerSyncBackends(), {
      extraArgument: ledgerSyncBackendsExtra(BACKENDS),
    });
    const first = result.current;

    rerender(undefined);

    expect(result.current).toBe(first);
  });

  it.each([
    ["no thunk extra argument", undefined],
    ["a thunk extra argument without backends", { other: "service" }],
    ["invalid backends", { ledgerSyncBackends: { keyRingApiBaseUrl: "not a url" } }],
  ])("should throw when the store has %s", (_case, extraArgument) => {
    expect(() => renderLedgerSyncHook(() => useLedgerSyncBackends(), { extraArgument })).toThrow(
      expect.objectContaining({ name: "LedgerSyncBackendsMissingError" }),
    );
  });
});

describe("ledgerSyncBackendsExtra", () => {
  it("should put the backends under ledgerSyncBackends", () => {
    expect(ledgerSyncBackendsExtra(BACKENDS)).toEqual({ ledgerSyncBackends: BACKENDS });
  });

  it.each([
    ["a relative path", { ...BACKENDS, keyRingApiBaseUrl: "/trustchain" }],
    ["a non-HTTP protocol", { ...BACKENDS, cloudSyncApiBaseUrl: "ftp://cloudsync.test" }],
  ])("should reject %s", (_case, backends) => {
    expect(() => ledgerSyncBackendsExtra(backends)).toThrow(
      expect.objectContaining({ name: "ZodError" }),
    );
  });

  it("should accept a local backend", () => {
    const local = { ...BACKENDS, keyRingApiBaseUrl: "http://localhost:8080" };

    expect(ledgerSyncBackendsExtra(local).ledgerSyncBackends).toEqual(local);
  });
});
