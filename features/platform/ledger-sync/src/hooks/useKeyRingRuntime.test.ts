/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": [""]}
 */
import { keyRingInitialState } from "@domain/entity-key-ring";
import { keyRingRuntimeExtra } from "@features/platform-key-ring";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useKeyRingRuntime } from "./useKeyRingRuntime";

const RUNTIME_EXTRA = keyRingRuntimeExtra({
  getState: () => ({ trustchain: keyRingInitialState }),
});

describe("useKeyRingRuntime", () => {
  it("should return the runtime of the thunk extra argument, the same on every render", () => {
    const { result, rerender } = renderLedgerSyncHook(() => useKeyRingRuntime(), {
      extraArgument: { other: "service", ...RUNTIME_EXTRA },
    });
    const first = result.current;

    rerender(undefined);

    expect(first).toBe(RUNTIME_EXTRA.keyRingRuntime);
    expect(result.current).toBe(first);
  });

  it.each([
    ["no thunk extra argument", undefined],
    ["a thunk extra argument without runtime", { other: "service" }],
  ])("should throw when the store has %s", (_case, extraArgument) => {
    expect(() => renderLedgerSyncHook(() => useKeyRingRuntime(), { extraArgument })).toThrow(
      expect.objectContaining({ name: "KeyRingRuntimeMissingError" }),
    );
  });
});
