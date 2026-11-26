/**
 * @jest-environment jsdom
 */
import { act } from "@testing-library/react";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import {
  KeyRingError,
  KeyRingMemberRemovedError,
  assertKeyRingMember,
  selectKeyRingSession,
} from "@features/platform-key-ring";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import type { LedgerSyncDeviceOutcome } from "../types";
import { member, newTreeUpdate } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useLedgerSyncMemberRemoval } from "./useLedgerSyncMemberRemoval";

const removed = member("member-2");

describe("useLedgerSyncMemberRemoval", () => {
  it("should remove the member, store the rotated key tree, then call onRemoved", async () => {
    const removeMember = jest.fn().mockResolvedValue(newTreeUpdate("rotated-root"));
    const callbacks = { onEndRequestUserInteraction: jest.fn() };
    const { result, store } = renderLedgerSyncHook(() => useLedgerSyncMemberRemoval());
    const session = selectKeyRingSession(store.getState());
    const onRemoved = jest.fn(() => {
      expect(selectKeyRingTreeId(store.getState())).toBe("rotated-root");
    });

    let outcome: LedgerSyncDeviceOutcome | undefined;
    await act(async () => {
      outcome = await result.current({
        client: fakeKeyRingClient({ removeMember }),
        session,
        member: removed,
        legacyDeviceId: "device-1",
        callbacks,
        onRemoved,
      });
    });

    expect(outcome).toEqual({ type: "done" });
    expect(removeMember).toHaveBeenCalledWith(session, {
      legacyDeviceId: "device-1",
      member: removed,
      callbacks,
    });
    expect(onRemoved).toHaveBeenCalledTimes(1);
  });

  it("should resolve a not-allowed failure without calling onRemoved", async () => {
    const error = new KeyRingError("not-allowed");
    const onRemoved = jest.fn();
    const { result, store } = renderLedgerSyncHook(() => useLedgerSyncMemberRemoval());

    let outcome: LedgerSyncDeviceOutcome | undefined;
    await act(async () => {
      outcome = await result.current({
        client: fakeKeyRingClient({ removeMember: jest.fn().mockRejectedValue(error) }),
        session: selectKeyRingSession(store.getState()),
        member: removed,
        onRemoved,
      });
    });

    expect(outcome).toEqual({ type: "failed", reason: "not-allowed", error });
    expect(onRemoved).not.toHaveBeenCalled();
  });

  it("should resolve the mobile member check failure without removing", async () => {
    const removeMember = jest.fn();
    const { result, store } = renderLedgerSyncHook(() => useLedgerSyncMemberRemoval(), {
      trustchain: mockKeyRingState({ trustchain: null }),
    });
    const session = selectKeyRingSession(store.getState());

    let outcome: LedgerSyncDeviceOutcome | undefined;
    await act(async () => {
      outcome = await result.current({
        client: fakeKeyRingClient({ removeMember }),
        session,
        member: removed,
        assertReady: () => assertKeyRingMember(session),
        onRemoved: jest.fn(),
      });
    });

    expect(outcome).toEqual({
      type: "failed",
      reason: "other",
      error: expect.any(KeyRingMemberRemovedError),
    });
    expect(removeMember).not.toHaveBeenCalled();
  });
});
