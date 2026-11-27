/**
 * @jest-environment jsdom
 */
import { waitFor } from "@testing-library/react";
import { selectHasKeyRingMemberKey } from "@domain/entity-key-ring";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import { mockEnvironmentKeyRingClient } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useInitMemberKey } from "./useInitMemberKey";

describe("useInitMemberKey", () => {
  it("should create and store a member key when the instance has none", async () => {
    const source = mockEnvironmentKeyRingClient();
    const createMemberKey = jest.fn(() => source.createMemberKey());
    const { result, store } = renderLedgerSyncHook(
      () => useInitMemberKey(fakeKeyRingClient({ createMemberKey })),
      { trustchain: mockKeyRingState({ trustchain: null, memberCredentials: null }) },
    );

    expect(result.current.hasMemberKey).toBe(false);
    await waitFor(() => expect(result.current.hasMemberKey).toBe(true));
    expect(createMemberKey).toHaveBeenCalledTimes(1);
    expect(selectHasKeyRingMemberKey(store.getState())).toBe(true);
  });

  it("should keep the member key the instance already has", () => {
    const createMemberKey = jest.fn();
    const { result } = renderLedgerSyncHook(() =>
      useInitMemberKey(fakeKeyRingClient({ createMemberKey })),
    );

    expect(result.current.hasMemberKey).toBe(true);
    expect(createMemberKey).not.toHaveBeenCalled();
  });
});
