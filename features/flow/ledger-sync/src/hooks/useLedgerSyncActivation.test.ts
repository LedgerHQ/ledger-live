/**
 * @jest-environment jsdom
 */
import { act } from "@testing-library/react";
import { selectKeyRingTreeId } from "@domain/entity-key-ring";
import {
  KeyRingError,
  selectKeyRingSession,
  type KeyRingActivation,
} from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import type { LedgerSyncDeviceOutcome } from "../types";
import { newTreeUpdate } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useLedgerSyncActivation } from "./useLedgerSyncActivation";

function activationOf(rootId: string): KeyRingActivation {
  return { outcome: "created", tree: newTreeUpdate(rootId) };
}

describe("useLedgerSyncActivation", () => {
  it("should activate on the legacy device, store the key tree, then call onActivated", async () => {
    const activation = activationOf("activated-root");
    const activate = jest.fn().mockResolvedValue(activation);
    const callbacks = { onStartRequestUserInteraction: jest.fn() };
    const { result, store } = renderLedgerSyncHook(() => useLedgerSyncActivation());
    const session = selectKeyRingSession(store.getState());
    const onActivated = jest.fn(() => {
      expect(selectKeyRingTreeId(store.getState())).toBe("activated-root");
    });

    let outcome: LedgerSyncDeviceOutcome | undefined;
    await act(async () => {
      outcome = await result.current({
        client: fakeKeyRingClient({ activate }),
        session,
        legacyDeviceId: "device-1",
        callbacks,
        onActivated,
      });
    });

    expect(outcome).toEqual({ type: "done" });
    expect(activate).toHaveBeenCalledWith(session, { legacyDeviceId: "device-1", callbacks });
    expect(onActivated).toHaveBeenCalledWith(activation);
  });

  it.each([true, false])("should pass allowTreeCreation %p when the app sets it", async value => {
    const activate = jest.fn().mockResolvedValue(activationOf("root"));
    const { result, store } = renderLedgerSyncHook(() => useLedgerSyncActivation());

    await act(() =>
      result.current({
        client: fakeKeyRingClient({ activate }),
        session: selectKeyRingSession(store.getState()),
        allowTreeCreation: value,
        onActivated: jest.fn(),
      }),
    );

    expect(activate.mock.calls[0][1]).toEqual(
      expect.objectContaining({ allowTreeCreation: value }),
    );
  });

  it("should leave allowTreeCreation out when the app does not set it", async () => {
    const activate = jest.fn().mockResolvedValue(activationOf("root"));
    const { result, store } = renderLedgerSyncHook(() => useLedgerSyncActivation());

    await act(() =>
      result.current({
        client: fakeKeyRingClient({ activate }),
        session: selectKeyRingSession(store.getState()),
        onActivated: jest.fn(),
      }),
    );

    expect(activate.mock.calls[0][1]).not.toHaveProperty("allowTreeCreation");
  });

  it.each([
    ["already-member", "already-member"],
    ["member-of-other-tree", "member-of-other-tree"],
    ["not-allowed", "not-allowed"],
    ["no-tree-for-seed", "no-tree-for-seed"],
    ["user-refused", "user-refused"],
    ["network", "other"],
  ] as const)("should resolve a %s failure as %s", async (category, reason) => {
    const error = new KeyRingError(category);
    const onActivated = jest.fn();
    const { result, store } = renderLedgerSyncHook(() => useLedgerSyncActivation());

    let outcome: LedgerSyncDeviceOutcome | undefined;
    await act(async () => {
      outcome = await result.current({
        client: fakeKeyRingClient({ activate: jest.fn().mockRejectedValue(error) }),
        session: selectKeyRingSession(store.getState()),
        onActivated,
      });
    });

    expect(outcome).toEqual({ type: "failed", reason, error });
    expect(onActivated).not.toHaveBeenCalled();
  });

  it("should resolve the error of assertReady without activating", async () => {
    const error = new Error("memberCredentials is not set");
    const activate = jest.fn();
    const { result, store } = renderLedgerSyncHook(() => useLedgerSyncActivation());

    let outcome: LedgerSyncDeviceOutcome | undefined;
    await act(async () => {
      outcome = await result.current({
        client: fakeKeyRingClient({ activate }),
        session: selectKeyRingSession(store.getState()),
        assertReady: () => {
          throw error;
        },
        onActivated: jest.fn(),
      });
    });

    expect(outcome).toEqual({ type: "failed", reason: "other", error });
    expect(activate).not.toHaveBeenCalled();
  });

  it("should resolve the error onActivated throws, the key tree stored", async () => {
    const error = new Error("navigation failed");
    const { result, store } = renderLedgerSyncHook(() => useLedgerSyncActivation());

    let outcome: LedgerSyncDeviceOutcome | undefined;
    await act(async () => {
      outcome = await result.current({
        client: fakeKeyRingClient({ activate: jest.fn().mockResolvedValue(activationOf("root")) }),
        session: selectKeyRingSession(store.getState()),
        onActivated: () => {
          throw error;
        },
      });
    });

    expect(outcome).toEqual({ type: "failed", reason: "other", error });
    expect(selectKeyRingTreeId(store.getState())).toBe("root");
  });

  it("should keep the same function across renders", () => {
    const { result, rerender } = renderLedgerSyncHook(() => useLedgerSyncActivation());
    const activate = result.current;
    rerender();
    expect(result.current).toBe(activate);
  });
});
