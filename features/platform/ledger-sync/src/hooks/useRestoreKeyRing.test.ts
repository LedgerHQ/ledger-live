/**
 * @jest-environment jsdom
 */
import { act, waitFor } from "@testing-library/react";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import { newTreeUpdate } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useRestoreKeyRing } from "./useRestoreKeyRing";

describe("useRestoreKeyRing", () => {
  it("should not restore on mount", () => {
    const restore = jest.fn();
    renderLedgerSyncHook(() => useRestoreKeyRing(fakeKeyRingClient({ restore })));
    expect(restore).not.toHaveBeenCalled();
  });

  it("should restore the key tree and store it when refetched", async () => {
    const restore = jest.fn().mockResolvedValue(newTreeUpdate("restored-root"));
    const { result, store } = renderLedgerSyncHook(() =>
      useRestoreKeyRing(fakeKeyRingClient({ restore })),
    );

    await act(() => result.current.refetch());

    expect(restore).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(selectKeyRingTreeId(store.getState())).toBe("restored-root"));
  });
});
