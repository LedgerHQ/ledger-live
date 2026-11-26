/**
 * @jest-environment jsdom
 */
import { act } from "@testing-library/react";
import { listen } from "@ledgerhq/logs";
import { selectIsKeyRingMember, selectKeyRingTreeId } from "@domain/entity-key-ring";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import {
  KeyRingError,
  KeyRingMemberRemovedError,
  KeyRingNotAllowedError,
  commitKeyRingTree,
  selectKeyRingSession,
  type KeyRingClient,
} from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import type { KeyRingRefreshOptions } from "../types";
import { listenToAnalytics, stopAnalytics } from "../__tests__/analytics";
import { newTreeUpdate } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useOnKeyRingRefreshNeeded } from "./useOnKeyRingRefreshNeeded";

const DESKTOP: KeyRingRefreshOptions = {
  resetOnCategories: ["member-removed"],
  readTreeIdAt: "call",
};
const MOBILE: KeyRingRefreshOptions = {
  resetOnCategories: ["member-removed", "not-allowed"],
  readTreeIdAt: "render",
};
const RESET = "trustchain/keyRingReset";

function renderRefresh(
  client: KeyRingClient,
  options: KeyRingRefreshOptions,
  trustchain = mockKeyRingState(),
) {
  const sequence: string[] = [];
  listenToAnalytics(sequence);
  const rendered = renderLedgerSyncHook(() => useOnKeyRingRefreshNeeded(client, options), {
    trustchain,
    sequence,
  });
  sequence.length = 0;
  return { ...rendered, sequence };
}

function refreshLogs() {
  const messages: string[] = [];
  const unsubscribe = listen(entry => {
    if (entry.type === "walletsync" && entry.message) messages.push(entry.message);
  });
  return { messages, unsubscribe };
}

afterEach(stopAnalytics);

describe("useOnKeyRingRefreshNeeded", () => {
  it("should restore the key tree and store it", async () => {
    const restore = jest.fn().mockResolvedValue(newTreeUpdate("restored-root"));
    const { result, store } = renderRefresh(fakeKeyRingClient({ restore }), DESKTOP);
    const session = selectKeyRingSession(store.getState());

    await act(() => result.current(session));

    expect(restore).toHaveBeenCalledWith(session);
    expect(selectKeyRingTreeId(store.getState())).toBe("restored-root");
  });

  it("should do nothing without a member key", async () => {
    const restore = jest.fn();
    const { result, store } = renderRefresh(
      fakeKeyRingClient({ restore }),
      DESKTOP,
      mockKeyRingState({ memberCredentials: null }),
    );

    await act(() => result.current(selectKeyRingSession(store.getState())));

    expect(restore).not.toHaveBeenCalled();
  });

  it.each([
    ["desktop", DESKTOP],
    ["mobile", MOBILE],
  ])(
    "should reset and track on a member-removed restore with the %s options",
    async (_app, options) => {
      const restore = jest.fn().mockRejectedValue(new KeyRingMemberRemovedError());
      const { result, store, sequence } = renderRefresh(fakeKeyRingClient({ restore }), options);

      await act(() => result.current(selectKeyRingSession(store.getState())));

      expect(sequence).toEqual([RESET, "track"]);
      expect(selectIsKeyRingMember(store.getState())).toBe(false);
    },
  );

  it.each([
    ["desktop", DESKTOP, []],
    ["mobile", MOBILE, [RESET, "track"]],
  ])("should handle a not-allowed restore with the %s options", async (_app, options, expected) => {
    const restore = jest.fn().mockRejectedValue(new KeyRingNotAllowedError());
    const { result, store, sequence } = renderRefresh(fakeKeyRingClient({ restore }), options);

    await act(() => result.current(selectKeyRingSession(store.getState())));

    expect(sequence).toEqual(expected);
  });

  it("should ignore any other restore failure", async () => {
    const restore = jest.fn().mockRejectedValue(new KeyRingError("network"));
    const { result, store, sequence } = renderRefresh(fakeKeyRingClient({ restore }), MOBILE);

    await act(() => result.current(selectKeyRingSession(store.getState())));

    expect(sequence).toEqual([]);
  });

  it("should keep its identity when the key tree id changes, and log the id when it runs, when it reads the tree id at call", async () => {
    const restore = jest.fn().mockRejectedValue(new KeyRingError("network"));
    const { result, store, rerender } = renderRefresh(fakeKeyRingClient({ restore }), DESKTOP);
    const handler = result.current;
    const logs = refreshLogs();

    act(() => {
      store.dispatch(commitKeyRingTree(newTreeUpdate("rotated-root")));
    });
    rerender();
    await act(() => handler(selectKeyRingSession(store.getState())));
    logs.unsubscribe();

    expect(result.current).toBe(handler);
    expect(logs.messages).toEqual(["onTrustchainRefreshNeeded rotated-root"]);
  });

  it("should change identity with the key tree id, and log the id of its render, when it reads the tree id at render", async () => {
    const restore = jest.fn().mockRejectedValue(new KeyRingError("network"));
    const { result, store } = renderRefresh(fakeKeyRingClient({ restore }), MOBILE);
    const firstHandler = result.current;
    const logs = refreshLogs();

    act(() => {
      store.dispatch(commitKeyRingTree(newTreeUpdate("rotated-root")));
    });
    await act(() => firstHandler(selectKeyRingSession(store.getState())));
    logs.unsubscribe();

    expect(result.current).not.toBe(firstHandler);
    expect(logs.messages).toEqual(["onTrustchainRefreshNeeded mock-root-id"]);
  });

  it("should keep its identity across renders that pass the same categories in a new array", () => {
    const client = fakeKeyRingClient();
    const { result, rerender } = renderLedgerSyncHook(
      (categories: KeyRingRefreshOptions["resetOnCategories"]) =>
        useOnKeyRingRefreshNeeded(client, { resetOnCategories: categories, readTreeIdAt: "call" }),
      { initialProps: ["member-removed"] },
    );
    const handler = result.current;

    rerender(["member-removed"]);

    expect(result.current).toBe(handler);
  });
});
