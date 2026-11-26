/**
 * @jest-environment jsdom
 */
import { act, waitFor } from "@testing-library/react";
import {
  selectIsKeyRingMember,
  selectKeyRingTreeId,
  type KeyRingState,
} from "@domain/entity-key-ring";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import {
  KeyRingError,
  KeyRingMemberRemovedError,
  KeyRingNotAllowedError,
  KeyRingOutdatedError,
  KeyRingTreeNotFoundError,
} from "@features/platform-key-ring";
import { fakeKeyRingClient } from "@features/platform-key-ring/testing";
import { LedgerSyncMembersUnresolvedError } from "../errors";
import type { LedgerSyncErrorRecoveryOptions } from "../types";
import { listenToAnalytics, stopAnalytics } from "../__tests__/analytics";
import { newTreeUpdate } from "../__tests__/fixtures";
import { renderLedgerSyncHook } from "../__tests__/harness";
import { useLedgerSyncErrorRecovery } from "./useLedgerSyncErrorRecovery";

const RESET = "trustchain/keyRingReset";

function renderRecovery(
  options: Partial<LedgerSyncErrorRecoveryOptions> = {},
  trustchain: KeyRingState = mockKeyRingState(),
) {
  const sequence: string[] = [];
  listenToAnalytics(sequence);
  const client = fakeKeyRingClient({
    invalidateAuth: jest.fn(() => {
      sequence.push("invalidateAuth");
    }),
    restore: jest.fn().mockResolvedValue(newTreeUpdate("restored-root")),
  });
  const onReset = jest.fn(() => {
    sequence.push("onReset");
  });
  const rendered = renderLedgerSyncHook(
    () =>
      useLedgerSyncErrorRecovery({
        client,
        onReset,
        ...options,
      }),
    { sequence, trustchain },
  );
  sequence.length = 0;
  return { ...rendered, client, onReset, sequence };
}

function api4xx(message: string): Error {
  return Object.assign(new Error(message), { name: "LedgerAPI4xx" });
}

afterEach(stopAnalytics);

describe("useLedgerSyncErrorRecovery", () => {
  it.each([
    ["member-removed", new KeyRingMemberRemovedError()],
    ["not-allowed", new KeyRingNotAllowedError()],
  ])("should reset, track, call onReset then drop the token on a %s error", (_category, error) => {
    const { result, sequence, store } = renderRecovery();

    act(() => result.current.handleError(error));

    expect(sequence).toEqual([RESET, "track", "onReset", "invalidateAuth"]);
    expect(selectIsKeyRingMember(store.getState())).toBe(false);
  });

  it("should restore the key tree on an outdated error without resetting", async () => {
    const { result, client, sequence, store } = renderRecovery();

    act(() => result.current.handleError(new KeyRingOutdatedError()));

    await waitFor(() => expect(selectKeyRingTreeId(store.getState())).toBe("restored-root"));
    expect(client.restore).toHaveBeenCalledTimes(1);
    expect(sequence).not.toContain(RESET);
  });

  it("should ignore an error it does not recover from", () => {
    const { result, sequence, onReset } = renderRecovery();

    act(() => result.current.handleError(new KeyRingError("network", "offline")));

    expect(sequence).toEqual([]);
    expect(onReset).not.toHaveBeenCalled();
  });

  it.each([
    ["4xx of the backend", api4xx("No such trustchain 02ab")],
    ["key ring error mapped from it", new KeyRingTreeNotFoundError("No such trustchain 02ab")],
  ])("should reset once when the backend lost the key tree, as the %s", (_case, error) => {
    const { result, sequence } = renderRecovery();

    act(() => result.current.handleError(error));

    expect(sequence).toEqual([RESET, "track", "onReset", "invalidateAuth"]);
  });

  it("should ignore a missing key tree while the instance has none", () => {
    const { result, onReset, sequence } = renderRecovery(
      {},
      mockKeyRingState({ trustchain: null }),
    );

    act(() => result.current.handleError(new KeyRingTreeNotFoundError("TrustchainNotFound")));

    expect(onReset).not.toHaveBeenCalled();
    expect(sequence).toEqual([]);
  });

  it("should ignore a refused key that is not in the key tree", () => {
    const { result, onReset } = renderRecovery();

    act(() => result.current.handleError(api4xx("Not a member of trustchain")));

    expect(onReset).not.toHaveBeenCalled();
  });

  it.each([
    ["without the option", {}, 0],
    ["with resetOnUnresolvedMembers", { resetOnUnresolvedMembers: true }, 1],
  ])("should reset on unresolved members only %s", (_case, options, resets) => {
    const { result, onReset } = renderRecovery(options, mockKeyRingState({ trustchain: null }));

    act(() =>
      result.current.handleError(new LedgerSyncMembersUnresolvedError(["useGetMembers", null])),
    );

    expect(onReset).toHaveBeenCalledTimes(resets);
  });

  it("should not reset on an error that only reads like unresolved members", () => {
    const { result, onReset } = renderRecovery({ resetOnUnresolvedMembers: true });

    act(() => result.current.handleError(new Error('["useGetMembers",null] data is undefined')));

    expect(onReset).not.toHaveBeenCalled();
  });

  it("should log the error before anything else when the app logs", () => {
    const sequenceRef: { current: string[] } = { current: [] };
    const logError = jest.fn(() => {
      sequenceRef.current.push("logError");
    });
    const { result, sequence } = renderRecovery({ logError });
    sequenceRef.current = sequence;
    const error = new KeyRingMemberRemovedError();

    act(() => result.current.handleError(error));

    expect(logError).toHaveBeenCalledWith(error);
    expect(sequence[0]).toBe("logError");
  });
});
